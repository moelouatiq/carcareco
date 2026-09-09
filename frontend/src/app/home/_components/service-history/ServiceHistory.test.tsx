import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ServiceHistory from "./ServiceHistory";
import { IServiceHistoryItem, IServiceHistoryPage } from "./model";

describe("ServiceHistory", () => {
  it("renders client history with work, vehicle, invoice view and download actions", () => {
    const markup = renderToStaticMarkup(
      <ServiceHistory scope="client" history={history([invoicedWork])} basePath="/home/clients/client-1" />,
    );

    expect(markup).toContain("Historique des interventions");
    expect(markup).toContain("Renault Clio · PHASE2-01");
    expect(markup).toContain("Diagnostic mécanique");
    expect(markup).toContain("Ouverte");
    expect(markup).toContain("Clôturée");
    expect(markup).toContain("Facture n° 7");
    expect(markup).toContain("420,00 MAD");
    expect(markup).not.toContain("EUR");
    expect(markup).not.toContain("€");
    expect(markup).toContain("/home/work/work-1");
    expect(markup).toContain("/api/backend/pricings/invoice/work-1/pdf");
    expect(markup).toContain("/api/backend/pricings/invoice/work-1/pdf/download");
    expect(markup.toLowerCase()).not.toContain("jwt");
    expect(markup.toLowerCase()).not.toContain("token=");
  });

  it("renders vehicle history as a desktop table and mobile cards", () => {
    const markup = renderToStaticMarkup(
      <ServiceHistory scope="vehicle" history={history([invoicedWork])} basePath="/home/vehicles/vehicle-1" />,
    );

    expect(markup).toContain("Historique d’entretien");
    expect(markup).toContain("125 100 km");
    expect(markup).toContain("Filtre à huile");
    expect(markup).toContain("hidden overflow-x-auto md:block");
    expect(markup).toContain("space-y-4 md:hidden");
  });

  it("renders the explicit empty states", () => {
    const clientMarkup = renderToStaticMarkup(
      <ServiceHistory scope="client" history={history([])} basePath="/home/clients/client-1" />,
    );
    const vehicleMarkup = renderToStaticMarkup(
      <ServiceHistory scope="vehicle" history={history([])} basePath="/home/vehicles/vehicle-1" />,
    );

    expect(clientMarkup).toContain("Aucune intervention enregistrée pour ce client.");
    expect(vehicleMarkup).toContain("Aucun historique d’entretien pour ce véhicule.");
  });

  it("marks an intervention without an invoice and hides PDF actions", () => {
    const markup = renderToStaticMarkup(
      <ServiceHistory
        scope="client"
        history={history([{ ...invoicedWork, hasInvoice: false, invoiceId: null, invoiceNumber: null, totalAmount: null }])}
        basePath="/home/clients/client-1"
      />,
    );

    expect(markup).toContain("Non facturée");
    expect(markup).not.toContain("/pdf");
    expect(markup).toContain("/home/work/work-1");
  });

  it("renders a clear API error state", () => {
    const markup = renderToStaticMarkup(
      <ServiceHistory scope="client" history={null} error basePath="/home/clients/client-1" />,
    );

    expect(markup).toContain("Impossible de charger l’historique pour le moment.");
    expect(markup).toContain("role=\"alert\"");
  });
});

const invoicedWork: IServiceHistoryItem = {
  workId: "work-1",
  workNumber: 42,
  openedOn: "2026-09-07T10:00:00Z",
  closedOn: "2026-09-08T10:00:00Z",
  status: "completed",
  clientId: "client-1",
  clientName: "Yasmine TestPhase2",
  vehicleId: "vehicle-1",
  registration: "PHASE2-01",
  vehicleMake: "Renault",
  vehicleModel: "Clio",
  odometer: 125100,
  summary: "Diagnostic mécanique",
  labor: [line("labor-1", "", "Diagnostic mécanique")],
  parts: [line("part-1", "FILTER", "Filtre à huile")],
  totalAmount: 420,
  currency: "MAD",
  invoiceNumber: 7,
  invoiceId: "invoice-7",
  hasInvoice: true,
};

function history(items: IServiceHistoryItem[]): IServiceHistoryPage {
  return {
    totalCount: items.length,
    totalInvoiced: items.reduce((total, item) => total + (item.totalAmount ?? 0), 0),
    lastServiceDate: items[0]?.openedOn ?? null,
    lastRecordedOdometer: items[0]?.odometer ?? null,
    offset: 0,
    limit: 10,
    hasMore: false,
    items,
  };
}

function line(id: string, code: string, name: string) {
  return {
    id,
    code,
    name,
    quantity: 1,
    unit: "pièce",
    unitPrice: 120,
    discount: 0,
  };
}
