import { describe, expect, it } from "vitest";
import { formatBalance, formatDay, formatMoney, formatMonth, formatSigned } from "../format";

describe("format", () => {
  it("เงิน", () => {
    expect(formatMoney(32000)).toBe("฿32,000");
    expect(formatMoney(12.5)).toBe("฿12.5");
    expect(formatSigned(120, "expense")).toBe("−฿120");
    expect(formatSigned(4500, "income")).toBe("+฿4,500");
    expect(formatBalance(-300)).toBe("−฿300");
    expect(formatBalance(300)).toBe("฿300");
  });

  it("เดือน/วัน ปี ค.ศ.", () => {
    expect(formatMonth("2026-09")).toBe("กันยายน 2026");
    expect(formatDay("2026-09-05")).toBe("5 ก.ย.");
  });
});
