import { nanoid } from "nanoid";
import crypto from "crypto";

import Document from "../models/Document.js";
import Shipment from "../models/Shipment.js";

class DocumentService {
  /**
   * Generate logistics document
   */
  async generateTransportDocument(shipment, user) {
    const documentType =
      shipment.mode === "air"
        ? "air_waybill"
        : "bill_of_lading";

    const documentNumber =
      shipment.mode === "air"
        ? `FLS-AWB-${nanoid(10).toUpperCase()}`
        : `FLS-BOL-${nanoid(10).toUpperCase()}`;

    const verificationHash = crypto
      .createHash("sha256")
      .update(
        `${shipment._id}-${documentNumber}-${Date.now()}`
      )
      .digest("hex");

    const document = await Document.create({
      shipment: shipment._id,

      type: documentType,

      status: "generated",

      documentNumber,

      verificationHash,

      version: 1,

      generatedBy: user._id,

      shipper: {
        name: user.fullName,
        company:
          user.companyName ||
          "Individual Shipper",

        email: user.email,

        phone: user.phone,

        address:
          shipment.origin?.address,
      },

      consignee: {
        name:
          shipment.receiver?.name ||
          "Pending Receiver",

        company:
          shipment.receiver?.company ||
          "",

        email:
          shipment.receiver?.email ||
          "",

        phone:
          shipment.receiver?.phone ||
          "",

        address:
          shipment.destination?.address,
      },

      transport: {
        mode: shipment.mode,

        vesselName:
          shipment.mode === "sea"
            ? shipment.vesselName ||
              "Flash Maritime Express"
            : null,

        flightNumber:
          shipment.mode === "air"
            ? shipment.flightNumber ||
              "FLASH-AIR"
            : null,

        originPort:
          shipment.origin?.portName,

        destinationPort:
          shipment.destination?.portName,
      },

      cargo: {
        description:
          shipment.cargoDescription,

        quantity:
          shipment.quantity || 1,

        weight:
          shipment.weight,

        volume:
          shipment.volume,

        packageCount:
          shipment.packageCount,
      },

      financials: {
        declaredValue:
          shipment.declaredValue,

        currency:
          shipment.currency || "USD",

        freightCharge:
          shipment.shippingCost,
      },

      cloudAssets: {
        pdfUrl: `https://cdn.flashshipping.com/documents/${documentNumber}.pdf`,

        qrCodeUrl: `https://cdn.flashshipping.com/qr/${documentNumber}.png`,
      },

      timeline: [
        {
          action: "DOCUMENT_GENERATED",
          actor: user._id,
          timestamp: new Date(),
        },
      ],
    });

    await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        $push: {
          documents: document._id,
        },
      }
    );

    return document;
  }

  /**
   * Verify document authenticity
   */
  async verifyDocument(documentNumber) {
    const document = await Document.findOne({
      documentNumber,
    });

    if (!document) {
      return {
        valid: false,
        message: "Document not found",
      };
    }

    return {
      valid: true,
      documentId: document._id,
      documentNumber:
        document.documentNumber,
      type: document.type,
      generatedAt:
        document.createdAt,
      verificationHash:
        document.verificationHash,
    };
  }

  /**
   * Create document revision
   */
  async createRevision(documentId, updates, userId) {
    const existing =
      await Document.findById(documentId);

    if (!existing)
      throw new Error("Document not found");

    existing.version += 1;

    Object.assign(existing, updates);

    existing.timeline.push({
      action: "DOCUMENT_REVISED",
      actor: userId,
      timestamp: new Date(),
    });

    await existing.save();

    return existing;
  }

  /**
   * Mark document signed
   */
  async signDocument(
    documentId,
    signerName
  ) {
    const document =
      await Document.findById(documentId);

    if (!document)
      throw new Error("Document not found");

    document.signed = true;

    document.signature = {
      signerName,
      signedAt: new Date(),
    };

    document.timeline.push({
      action: "DOCUMENT_SIGNED",
      actor: signerName,
      timestamp: new Date(),
    });

    await document.save();

    return document;
  }
}

export default new DocumentService();