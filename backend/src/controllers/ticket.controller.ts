import { Request, Response, NextFunction } from 'express';

import * as ticketService from '../services/ticket.service';
import * as saleService from '../services/sale.service';
import * as configService from '../services/config.service';
import { Errors } from '../utils/AppError';

export async function generateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await configService.getConfig();
    if (!config.usesTicketsPdf) {
      throw Errors.forbidden('PDF tickets feature is disabled');
    }

    const saleId = Number(req.params.id);
    if (!saleId || isNaN(saleId)) {
      throw Errors.validation('Sale ID must be a valid number');
    }

    // Non-admin users can only generate tickets for their own sales
    if (req.user!.role !== 'admin') {
      const sale = await saleService.findById(saleId);
      if (sale.cashierId !== req.user!.id) {
        throw Errors.forbidden('You can only generate tickets for your own sales');
      }
    }

    const pdfBuffer = await ticketService.generateTicketPdf(saleId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ticket-venta-${saleId}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
