import { Header } from '@/components/shared/header';
import { Card, CardContent } from '@/components/ui/card';

export default function VenmoPage() {
  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-md mx-auto px-4 py-16">
        <Card className="bg-white/95 overflow-hidden">
          <div className="bg-masters-green p-5 text-center">
            <h1 className="font-serif text-2xl font-bold text-white">Pay Entry Fee</h1>
            <p className="text-white/70 text-sm mt-1">$20 per team</p>
          </div>
          <CardContent className="p-6 text-center space-y-5">
            <img
              src="/venmo-qr.jpg"
              alt="Venmo QR Code"
              className="w-56 h-56 mx-auto rounded-lg"
            />
            <div>
              <p className="font-serif font-bold text-lg text-masters-green">@Jack-Kavanagh</p>
              <p className="text-sm text-gray-500 mt-1">Send as personal payment</p>
            </div>
            <a
              href="https://venmo.com/u/Jack-Kavanagh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#008CFF] text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#0070CC] transition-colors"
            >
              Open Venmo
            </a>
            <div className="bg-masters-cream border border-masters-warm rounded-lg p-4 text-sm text-gray-600">
              Put your <strong>Team Name</strong> in the payment description
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
