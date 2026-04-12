# ============================================================
# DEPRECATED: Legacy screening endpoints
# ============================================================
# This file is no longer active. All screening functionality has been
# migrated to `app.modules.screening.router` which is included in main.py.
# Kept as a reference; do NOT register this router in main.py.
#
# The original file had broken imports to modules that no longer exist:
#   - app.models.assessment (migrated to app.modules.screening.model)
#   - app.services.scoring (merged into app.modules.screening.service)
#   - app.services.risk_engine (merged into app.modules.screening.service.determine_risk)
