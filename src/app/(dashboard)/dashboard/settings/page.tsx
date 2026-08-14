import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1C1E] mb-2">Settings</h1>
        <p className="text-[#5B5F73]">Manage your application preferences and security settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Update your password and security preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#5B5F73]">Settings functionality will be available in the next phase.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates and alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#5B5F73]">Notification preferences will be available in the next phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
