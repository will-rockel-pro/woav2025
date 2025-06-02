import SignInButton from '@/components/auth/SignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Sign In to WOAV Lite</CardTitle>
          <CardDescription>
            Access your collections and discover new content by signing in with Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6 pt-0">
          <SignInButton />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our (non-existent yet) Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
