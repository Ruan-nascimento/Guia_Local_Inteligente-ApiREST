import type { Request, Response } from "express";
import { searchRegion } from "../services/search.service";

export async function searchController(req: Request, res: Response) {
  try {
    const { cep } = req.params;

    if (!cep) {
      return res.status(400).json({
        message: "CEP não informado.",
      });
    }

    const result = await searchRegion(String(cep));

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível buscar informações da região.";

    return res.status(400).json({ message });
  }
}
