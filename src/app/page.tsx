import Masthead from "@/components/Masthead";
import Screener from "@/components/Screener";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <Masthead />
      <main className="flex-1">
        <Screener />
      </main>
      <SiteFooter />
    </>
  );
}
