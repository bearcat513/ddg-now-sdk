import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { ApiKeys, describeExpiry } from "./ApiKeys";

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

describe("how an expiry reads", () => {
  test("a key with no expiry says so rather than showing a blank", () => {
    expect(describeExpiry("")).toEqual({ text: "Never expires", expired: false });
  });

  test("a live key counts down in days", () => {
    // Half an hour past 29 days, so the ceiling lands on 30 rather than on a
    // number that changes with the second the test runs.
    expect(describeExpiry(inDays(29.5)).text).toBe("Expires in 30 days");
    expect(describeExpiry(inDays(29.5)).expired).toBe(false);
  });

  test("the last day is singular", () => {
    expect(describeExpiry(inDays(0.5)).text).toBe("Expires tomorrow");
  });

  test("a key past its expiry is marked expired, not counted down", () => {
    const gone = describeExpiry(inDays(-1));
    expect(gone).toEqual({ text: "Expired", expired: true });
    // The boundary itself is over, not "expires in 0 days".
    expect(describeExpiry(new Date().toISOString()).expired).toBe(true);
  });
});

describe("the panel", () => {
  test("offers the issuing form before the list has loaded", () => {
    const html = renderToString(<ApiKeys confirmDestructive />);
    expect(html).toContain('id="key-name"');
    expect(html).toContain('id="key-expiry"');
    expect(html).toContain("Create key");
  });

  test("says what a key can and cannot do, since that is the whole safety story", () => {
    const html = renderToString(<ApiKeys confirmDestructive />).replaceAll("<!-- -->", "");
    expect(html).toContain("cannot issue or revoke keys");
  });
});
