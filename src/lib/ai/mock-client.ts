import type { AiChatRequest, AiChatResponse, AiClient } from "./types";
import fitmentData from "../../../data/fitment.json";
import productsData from "../../../data/products.json";
import { resolveFitment } from "@/lib/fitment/resolve";
import type { FitmentRecord, Product, VehicleSelection } from "@/types";

const products = (productsData as Product[]).filter((p) => p.catalogSource === "owner" && p.active !== false);
const fitment = fitmentData as FitmentRecord[];

const RULE =
  "Never claim product compatibility unless FitmentStatus is verified. Prefer ‘chưa xác minh / not verified’.";

function detectIntents(text: string): string[] {
  const t = text.toLowerCase();
  const intents: string[] = [];
  if (/dashcam|camera hành trình|cam hành trình/.test(t)) intents.push("dashcam");
  if (/head.?unit|màn hình|android/.test(t)) intents.push("head-unit");
  if (/carplay|apple/.test(t)) intents.push("carplay");
  if (/360|toàn cảnh/.test(t)) intents.push("camera-360");
  if (/đèn|light|led/.test(t)) intents.push("lights");
  if (/giá|price|bao nhiêu|cost/.test(t)) intents.push("price");
  if (/lắp|fit|tương thích|compatible|install/.test(t)) intents.push("fitment");
  if (/combo|gói|package/.test(t)) intents.push("combo");
  return intents.length ? intents : ["general"];
}

function productBlurb(locale: "vi" | "en", categoryId?: string): string {
  const list = categoryId
    ? products.filter((p) => p.categoryId === categoryId && p.active !== false)
    : products.filter((p) => p.active !== false).slice(0, 4);

  if (!list.length) return locale === "vi" ? "Chưa có giá bán được duyệt. Xem danh mục Toyota / Lexus tại /vi/catalog; cấu hình cần xác minh và hỏi giá riêng." : "No approved retail price. Browse Toyota / Lexus references at /en/catalog; fitment requires verification and pricing is on request.";
  return list
    .map((p) => {
      const status = resolveFitment(
        p.id,
        null,
        fitment,
      ).status;
      const badge =
        locale === "vi"
          ? status === "verified"
            ? "Đã xác minh"
            : "Cần xác minh"
          : status === "verified"
            ? "Verified"
            : "Needs verification";
      return `• ${p.sku}: $${p.priceUsd} (${locale === "vi" ? "chỉ máy; công lắp không bao gồm; thuế và vận chuyển chưa xác nhận" : "hardware only; installation excluded; tax and shipping unconfirmed"}) — ${badge}`;
    })
    .join("\n");
}

function fitmentReply(
  locale: "vi" | "en",
  vehicle: VehicleSelection | null,
  vehicleLabel?: string,
): string {
  if (!vehicle) {
    return locale === "vi"
      ? "Bạn hãy chọn xe trước (hãng → dòng → năm → phiên bản). Tôi chỉ nói về lắp đặt khi đã có xe — và chỉ khẳng định tương thích nếu trạng thái là Đã xác minh."
      : "Please select a vehicle first (brand → model → year → trim). I only discuss installation with a vehicle selected — and only claim compatibility when status is Verified.";
  }

  const samples = products.slice(0, 5).map((p) => {
    const { status } = resolveFitment(p.id, vehicle, fitment);
    const label =
      status === "verified"
        ? locale === "vi"
          ? "Đã xác minh"
          : "Verified"
        : status === "incompatible"
          ? locale === "vi"
            ? "Không phù hợp"
            : "Not compatible"
          : locale === "vi"
            ? "Cần xác minh"
            : "Needs verification";
    return `• ${p.sku}: ${label}`;
  });

  if (locale === "vi") {
    return [
      `Với xe ${vehicleLabel ?? "đã chọn"}, trạng thái fitment:`,
      ...samples,
      "",
      "Mặc định là Cần xác minh nếu chưa có hồ sơ kiểm tra. Đây là gợi ý tham khảo — vui lòng xác nhận với kỹ thuật viên trước khi lắp.",
      `(Rule: ${RULE})`,
    ].join("\n");
  }

  return [
    `For ${vehicleLabel ?? "your vehicle"}, fitment status:`,
    ...samples,
    "",
    "Default is Needs verification when no inspection record exists. These are reference suggestions — confirm with a technician before install.",
    `(Rule: ${RULE})`,
  ].join("\n");
}

export class MockAiClient implements AiClient {
  readonly name = "mock-rule-based";

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const last = [...request.messages].reverse().find((m) => m.role === "user");
    const text = last?.content ?? "";
    const intents = detectIntents(text);
    const { locale, vehicle, vehicleLabel } = request.context;

    let content: string;

    if (intents.includes("fitment")) {
      content = fitmentReply(locale, vehicle, vehicleLabel);
    } else if (intents.includes("dashcam")) {
      content =
        locale === "vi"
          ? `Gợi ý dashcam (tham khảo, xem badge fitment trên từng sản phẩm):\n${productBlurb(locale, "dashcam")}\n\nKhông khẳng định lắp được trừ khi badge = Đã xác minh.`
          : `Dashcam suggestions (reference — check each fitment badge):\n${productBlurb(locale, "dashcam")}\n\nDo not assume compatibility unless badge = Verified.`;
    } else if (intents.includes("head-unit")) {
      content =
        locale === "vi"
          ? `Gợi ý Android head unit:\n${productBlurb(locale, "head-unit")}\n\nMột số xe (vd. Tesla) có thể Không phù hợp — xem badge.`
          : `Android head unit suggestions:\n${productBlurb(locale, "head-unit")}\n\nSome vehicles (e.g. Tesla) may be Not compatible — check badges.`;
    } else if (intents.includes("carplay")) {
      content =
        locale === "vi"
          ? `Gợi ý CarPlay:\n${productBlurb(locale, "carplay")}`
          : `CarPlay suggestions:\n${productBlurb(locale, "carplay")}`;
    } else if (intents.includes("camera-360")) {
      content =
        locale === "vi"
          ? `Gợi ý camera 360:\n${productBlurb(locale, "camera-360")}`
          : `360 camera suggestions:\n${productBlurb(locale, "camera-360")}`;
    } else if (intents.includes("lights")) {
      content =
        locale === "vi"
          ? `Gợi ý đèn:\n${productBlurb(locale, "lights")}`
          : `Lighting suggestions:\n${productBlurb(locale, "lights")}`;
    } else if (intents.includes("price") || intents.includes("combo")) {
      content =
        locale === "vi"
          ? `Giá máy USD đã được chủ cửa hàng cung cấp. Công lắp không bao gồm; thuế và vận chuyển chưa xác nhận. Thêm sản phẩm vào Combo rồi xuất PDF báo giá.\n${productBlurb(locale)}`
          : `Owner-provided hardware prices in USD. Installation excluded; tax inclusion and shipping unconfirmed. Add items to Combo then export a PDF quote.\n${productBlurb(locale)}`;
    } else {
      content =
        locale === "vi"
          ? `Xin chào! Tôi là tư vấn rule-based (không gọi LLM trả phí).\nBạn có thể hỏi về dashcam, màn Android, CarPlay, camera 360, đèn, giá, hoặc “có lắp được không?”.\nLuôn kiểm tra badge fitment — mặc định Cần xác minh.`
          : `Hi! I'm a rule-based advisor (no paid LLM).\nAsk about dashcam, Android head units, CarPlay, 360 cameras, lights, pricing, or “will it fit?”.\nAlways check fitment badges — default is Needs verification.`;
    }

    return {
      message: { role: "assistant", content },
      meta: { provider: this.name, intents },
    };
  }
}
