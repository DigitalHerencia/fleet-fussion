import { Button } from "@/components/ui/button"
import { ArrowRight, Truck, Shield, BarChart3, FileText, MapPin, Users, Calendar, CreditCard } from "lucide-react"
import PricingSection from "@/components/pricing/pricing-section"
import { SharedFooter } from "@/components/shared/shared-footer"
import Image from "next/image"
import Link from "next/link"
import { PublicNav } from "@/components/shared/public-nav"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />
      {/* Main content area */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-0 xl:py-0 relative lg:min-h-[600px] xl:min-h-[700px] 2xl:min-h-[800px] overflow-hidden">
          {/* Background image for large screens */}
          <div className="hidden lg:block absolute inset-0 w-full h-full z-0">
            <Image
              src="/landing_hero.png"
              alt="FleetFusion Hero Background"
              width={1920}
              height={1080}
              className="w-full h-full object-cover object-right-bottom"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="container px-4 md:px-6 relative z-10 flex items-center min-h-[400px] lg:min-h-[600px] xl:min-h-[700px] 2xl:min-h-[800px]">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2 w-full">
              <div className="flex flex-col justify-center space-y-4 pl-6 md:pl-12 xl:pl-20 lg:bg-transparent lg:backdrop-blur-none lg:shadow-none bg-black/70 rounded-xl p-6 lg:p-0">
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold text-white/90 tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Run Your Fleet Like a Fortune 500 - Even If You Park at Mom & Pop's.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl text-white/90 lg:text-muted-foreground">
                    FleetFusion unifies dispatch, compliance, and real‑time analytics so you can get freight out the door—faster, safer, smarter.
                  </p>
                </div>                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    asChild
                    className="w-full py-2 rounded-lg font-semibold text-white bg-blue-400 hover:bg-blue-700 transition-colors"
                  >
                    <Link href="/sign-up">
                      Start Free 30-Day Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              {/* Show hero image only on small screens */}
              <div className="flex items-center justify-center lg:hidden">
                <Image
                  alt="Automated Compliance Management"
                  className="aspect-video overflow-hidden rounded-xl object-fit object-center shadow-lg border border-muted"
                  src="/trucksz_splash.png"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-5xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tighter md:text-5xl/tight">
                  Comprehensive Fleet Management Features
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to manage your fleet operations efficiently and effectively.
                </p>
              </div>
            </div>
            <div className="flex justify-center w-full">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Live Dispatch Board</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Real-time assignments, drag-drop scheduling, and geofenced ETAs.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Driver Hub</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    ELD-ready HOS logs, DVIR, fuel receipts, and mobile scanning.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Compliance & Safety</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    FMCSA snapshots, CSA scores, and automated compliance reminders.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Maintenance Tracking</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Mileage-based PM, work orders, and warranty/recall alerts.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">IFTA & Fuel Tax</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Automatic jurisdiction mileage and quarterly form exports.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Billing & Settlements</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Rate-confirm to invoice workflows and driver settlements.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Insurance & Risk</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    COI vault, expiration alerts, and loss-run reports.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Analytics Studio</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Cost-per-mile, empty-mile %, and customizable dashboards.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">Customer Portal</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Shipment visibility, e-POD download, and live map tracking.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <PricingSection />
      </main>
      <SharedFooter />
    </div>
  )
}