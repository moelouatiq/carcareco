import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ClientAddress from "./ClientAddressInput";

const address = (country: string) => ({
  street: "12 Bd Zerktouni",
  city: "Casablanca",
  region: "Casablanca-Settat",
  postalCode: "20000",
  country,
});

describe("ClientAddress", () => {
  it("defaults a new address to Maroc", () => {
    const markup = renderToStaticMarkup(<ClientAddress name="street-address" />);

    expect(markup).toContain('value="Maroc" selected');
  });

  it("lists countries in French", () => {
    const markup = renderToStaticMarkup(<ClientAddress name="street-address" />);

    expect(markup).toContain(">Maroc<");
    expect(markup).toContain(">Espagne<");
    expect(markup).toContain(">Allemagne<");
    expect(markup).not.toContain(">Morocco<");
    expect(markup).not.toContain(">Germany<");
  });

  it("keeps an existing address on its saved country instead of forcing Maroc", () => {
    const markup = renderToStaticMarkup(
      <ClientAddress name="street-address" address={address("Espagne")} />,
    );

    expect(markup).toContain('value="Espagne" selected');
    expect(markup).not.toContain('value="Maroc" selected');
  });

  it("still offers a legacy country value that is not in the French list", () => {
    // Addresses saved before the switch hold English names or ISO codes; editing a client must
    // not silently drop them.
    const markup = renderToStaticMarkup(
      <ClientAddress name="street-address" address={address("Estonia")} />,
    );

    expect(markup).toContain('value="Estonia" selected');
  });
});
