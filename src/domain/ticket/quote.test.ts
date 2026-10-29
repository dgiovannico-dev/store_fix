import { QuoteStatus, TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  blocksCompleteWork,
  canDecideQuote,
  canProposeQuote,
  parseQuoteAmount,
} from "./quote";

describe("quote domain", () => {
  it("propose solo su assigned/in_progress/waiting_parts", () => {
    expect(canProposeQuote(TicketStatus.assigned)).toBe(true);
    expect(canProposeQuote(TicketStatus.open)).toBe(false);
    expect(canProposeQuote(TicketStatus.done)).toBe(false);
  });

  it("decide solo se pending e ticket ancora aperto path", () => {
    expect(
      canDecideQuote(TicketStatus.in_progress, QuoteStatus.pending),
    ).toBe(true);
    expect(
      canDecideQuote(TicketStatus.in_progress, QuoteStatus.accepted),
    ).toBe(false);
    expect(canDecideQuote(TicketStatus.done, QuoteStatus.pending)).toBe(false);
  });

  it("blocks complete se pending", () => {
    expect(blocksCompleteWork(QuoteStatus.pending)).toBe(true);
    expect(blocksCompleteWork(QuoteStatus.accepted)).toBe(false);
    expect(blocksCompleteWork(null)).toBe(false);
  });

  it("parseQuoteAmount positivo", () => {
    expect(parseQuoteAmount("12.345")).toBe(12.35);
    expect(parseQuoteAmount(0)).toBeNull();
    expect(parseQuoteAmount(-1)).toBeNull();
  });
});
