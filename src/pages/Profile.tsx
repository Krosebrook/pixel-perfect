import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { SandboxToggle } from '@/components/SandboxToggle';
import { DataExportSection } from '@/components/DataExportSection';
import { useLocalProfile } from '@/hooks/useLocalProfile';

export default function Profile() {
  const { profile, updateProfile } = useLocalProfile();

  const handleSave = () => {
    // Profile is already persisted via updateProfile, just confirm
    toast.success('Profile updated successfully');
  };

  const initials = (profile.displayName || 'User').substring(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <aside className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{profile.displayName || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">Local Profile</p>
                  </div>
                  <Badge variant="secondary">
                    <User className="h-3 w-3 mr-1" />
                    user
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <Badge variant="outline">{profile.environmentMode}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your profile information (saved locally)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => updateProfile({ displayName: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>

                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <SandboxToggle />
            <DataExportSection />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
