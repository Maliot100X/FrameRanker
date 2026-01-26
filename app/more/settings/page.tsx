import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="w-8 h-8 text-gray-400" />
        Settings
      </h1>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Notifications</h3>
          <Card className="divide-y divide-gray-800 bg-gray-900/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive alerts for reviews and boost ends</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Privacy</h3>
          <Card className="divide-y divide-gray-800 bg-gray-900/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-gray-500">Allow others to see your stats</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </section>

        <div className="pt-4">
            <Button variant="destructive" className="w-full">
                Disconnect Wallet
            </Button>
        </div>
      </div>
    </div>
  );
}
