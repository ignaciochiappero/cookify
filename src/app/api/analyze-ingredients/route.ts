import { NextRequest, NextResponse } from "next/server";
import { analyzeIngredientImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const inventoryData = formData.get("inventory") as string;

    if (!image) {
      return NextResponse.json(
        { error: "No se proporcionó imagen" },
        { status: 400 }
      );
    }

    const inventory = JSON.parse(inventoryData || "[]");

    // Convertir File a Buffer para el servidor
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(
      `Analizando imagen: ${image.name}, tamaño: ${image.size} bytes`
    );

    // Timeout más largo para análisis de imágenes (5 minutos)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Timeout: El análisis tardó más de 5 minutos")),
        300000
      );
    });

    const analysisPromise = analyzeIngredientImage(
      buffer,
      inventory,
      image.type
    );

    const result = await Promise.race([analysisPromise, timeoutPromise]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analizando ingredientes:", error);
    return NextResponse.json(
      { error: "Error al analizar la imagen" },
      { status: 500 }
    );
  }
}
