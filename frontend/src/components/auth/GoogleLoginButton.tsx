import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface Props {
  onSuccess: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export default function GoogleLoginButton({ onSuccess, text = 'continue_with' }: Props) {
  const handleSuccess = (res: CredentialResponse) => {
    if (res.credential) {
      onSuccess(res.credential);
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google Login Failed')}
        text={text}
        shape="rectangular"
        theme="outline"
        size="large"
        width="350"
      />
    </div>
  );
}
