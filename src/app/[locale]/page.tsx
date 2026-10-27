import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const vi = locale === "vi";
  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[2rem] bg-[var(--brand)] p-6 text-white shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-white/75">Toyota · Lexus</p>
      <h1 className="mt-3 text-3xl font-bold leading-tight">{vi ? "Khám phá nâng cấp cho chiếc xe của anh." : "Explore upgrades for your car."}</h1>
      <p className="mt-4 text-sm leading-relaxed text-white/80">{vi ? "Không cần tài khoản. Chọn xe, xem hình và gom những món quan tâm vào một gói — chưa cần quyết định mua." : "No account needed. Choose a vehicle, explore photos and collect your favourites in one package — no purchase needed."}</p>
      <Link href={`/${locale}/vehicle`} className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-[var(--accent)] px-4 font-bold text-[var(--ink)]">{vi ? "Bắt đầu · Chọn xe" : "Start · Choose vehicle"}</Link>
      <Link href={`/${locale}/catalog`} className="mt-2 flex min-h-11 items-center justify-center text-sm font-semibold underline underline-offset-4">{vi ? "Xem danh mục trước" : "Explore the catalogue first"}</Link>
    </section>
    <ol aria-label={vi ? "Cách sử dụng" : "How it works"} className="grid grid-cols-3 gap-2">
      {(vi ? ["Chọn xe", "Xem & chọn món", "Xem lại gói"] : ["Choose car", "Explore & select", "Review package"]).map((s,i) => <li key={s} className="rounded-2xl border border-[var(--line)] bg-white p-3 text-xs font-semibold"><span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">{i+1}</span>{s}</li>)}
    </ol>
    <section className="grid gap-3 sm:grid-cols-2" aria-label={vi ? "Danh mục nâng cấp" : "Upgrade collections"}>
      <Link href={`/${locale}/catalog`} className="rounded-3xl border border-[var(--line)] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">Toyota / Lexus</p>
        <h2 className="mt-2 text-lg font-bold">{vi ? "Màn hình & CarPlay" : "Screens & CarPlay"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{vi ? "Xem hình cấu hình nguyên bản, mở chi tiết và lưu mẫu quan tâm." : "Browse original-system photos, inspect details and save reference configurations."}</p>
        <p className="mt-4 text-sm font-semibold text-[var(--brand)]">{vi ? "Khám phá cấu hình →" : "Explore configurations →"}</p>
      </Link>
      <Link href={`/${locale}/recommend`} className="rounded-3xl border border-[var(--line)] bg-white p-5">
        <Image src="/products/botslab-g980-4ch.png" alt="Botslab G980" width={660} height={700} className="mx-auto h-32 w-full object-contain" />
        <h2 className="mt-2 text-lg font-bold">{vi ? "Camera hành trình" : "Dash cameras"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{vi ? "Xem máy, giá thiết bị và chọn vào gói dự kiến." : "Explore hardware, device prices and build a draft package."}</p>
        <p className="mt-4 text-sm font-semibold text-[var(--brand)]">{vi ? "Xem camera →" : "Explore cameras →"}</p>
      </Link>
    </section>
    <p className="rounded-2xl bg-[var(--wash)] p-4 text-xs leading-relaxed text-[var(--muted)]">{vi ? "Bản trải nghiệm nội bộ. Mẫu tham khảo không xác nhận tương thích; giá và hạng mục chưa xác minh được ghi rõ. Chưa có thao tác đặt mua hoặc thanh toán." : "Internal experience preview. References do not confirm compatibility; unverified prices and details are labelled. No purchase or payment is placed."}</p>
  </div>;
}
