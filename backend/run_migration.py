"""Run migration via Supabase Management API (SQL query endpoint)."""
import os
import requests
from dotenv import load_dotenv
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

# Method: Use the Supabase SQL endpoint via the PostgREST proxy
# We need to create a temporary helper function first, then run our DDL

sql = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='specialty') THEN
        ALTER TABLE users ADD COLUMN specialty VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='location') THEN
        ALTER TABLE users ADD COLUMN location VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='experience') THEN
        ALTER TABLE users ADD COLUMN experience VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gender') THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(50);
    END IF;
END $$;
"""

# Try using the Supabase SQL API endpoint
# The project ref is extractable from the URL
project_ref = url.replace("https://", "").replace(".supabase.co", "")
print(f"Project ref: {project_ref}")

# Try direct PostgREST - create a temporary function, run it, then drop it
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Step 1: Create a temporary migration function
create_func_sql = f"""
CREATE OR REPLACE FUNCTION _run_migration() RETURNS void AS $body$
{sql}
$body$ LANGUAGE plpgsql SECURITY DEFINER;
"""

# We can't run raw SQL via PostgREST. Let's try using psycopg2 or pg8000 instead.
try:
    import psycopg2
    # Supabase connection string format
    conn_str = f"postgresql://postgres.{project_ref}:{os.getenv('SUPABASE_DB_PASSWORD', '')}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    print(f"Trying psycopg2 connection...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    print("Migration successful via psycopg2!")
    cur.close()
    conn.close()
except ImportError:
    print("psycopg2 not available")
except Exception as e:
    print(f"psycopg2 error: {e}")

# Fallback: try httpx to call the /query endpoint
try:
    # Some Supabase instances expose a /pg endpoint
    resp = requests.post(
        f"{url}/pg",
        headers=headers,
        json={"query": sql}
    )
    print(f"Direct /pg endpoint: {resp.status_code} {resp.text[:200] if resp.text else ''}")
except Exception as e:
    print(f"/pg endpoint error: {e}")

print("\n" + "="*60)
print("If automated migration failed, please run this SQL in your")
print("Supabase SQL Editor (https://supabase.com/dashboard):")
print("="*60)
print("""
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
""")
