import { describe, expect, it } from "vitest";
import { MockAiClient, OpenAiClient } from "@/lib/ai";

describe("AiClient adapters", () => {
  it("uses only owner retail and sends unknown category prices to references", async () => {
    const client = new MockAiClient();
    const camera = await client.chat({messages:[{role:"user",content:"dashcam price"}],context:{locale:"en",vehicle:null}});
    expect(camera.message.content).toContain("$115");
    expect(camera.message.content).toContain("$230");
    expect(camera.message.content).toContain("hardware only");
    expect(camera.message.content).not.toMatch(/189|329|labor \$0/);
    const carplay = await client.chat({messages:[{role:"user",content:"CarPlay"}],context:{locale:"en",vehicle:null}});
    expect(carplay.message.content).toContain("price");
    expect(carplay.message.content).toContain("/en/catalog");
  });
  it("MockAiClient answers fitment questions without claiming unverified compatibility", async () => {
    const client = new MockAiClient();
    const res = await client.chat({
      messages: [{ role: "user", content: "Có lắp được xe tôi không?" }],
      context: {
        locale: "vi",
        vehicle: {
          brandId: "toyota",
          modelId: "camry",
          yearId: "camry-2024",
          trimId: "camry-2024-xle",
        },
        vehicleLabel: "Toyota Camry 2024 XLE",
      },
    });
    expect(res.meta?.provider).toBe("mock-rule-based");
    expect(res.message.content.toLowerCase()).toMatch(/xác minh|verified/);
    expect(res.message.content).not.toMatch(/đảm bảo tương thích/i);
  });

  it("OpenAiClient throws without calling network when key missing", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const client = new OpenAiClient();
    await expect(
      client.chat({
        messages: [{ role: "user", content: "hi" }],
        context: { locale: "en", vehicle: null },
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);
    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });

  it("OpenAiClient refuses network even when key is present (Phase 1)", async () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test-not-real";
    const client = new OpenAiClient();
    await expect(
      client.chat({
        messages: [{ role: "user", content: "hi" }],
        context: { locale: "en", vehicle: null },
      }),
    ).rejects.toThrow(/disabled in Phase 1/);
    if (prev === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prev;
  });
});
