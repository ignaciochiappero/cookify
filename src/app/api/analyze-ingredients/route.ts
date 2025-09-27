import { NextRequest, NextResponse } from "next/server";
import { analyzeIngredientImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIO ANÁLISIS DE IMAGEN ===");
    
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const inventoryData = formData.get("inventory") as string;

    console.log("Datos recibidos:", {
      hasImage: !!image,
      imageName: image?.name,
      imageSize: image?.size,
      inventoryData: inventoryData?.substring(0, 100) + "..."
    });

    if (!image) {
      console.log("ERROR: No se proporcionó imagen");
      return NextResponse.json(
        { error: "No se proporcionó imagen" },
        { status: 400 }
      );
    }

    const inventory = JSON.parse(inventoryData || "[]");
    console.log("Inventario parseado:", inventory.length, "elementos");

    // Convertir File a Buffer para el servidor
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(
      `Analizando imagen: ${image.name}, tamaño: ${image.size} bytes, buffer: ${buffer.length} bytes`
    );

    // Timeout más largo para análisis de imágenes (5 minutos)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Timeout: El análisis tardó más de 5 minutos")),
        300000
      );
    });

    console.log("Llamando a analyzeIngredientImage...");
    const analysisPromise = analyzeIngredientImage(
      buffer,
      inventory,
      image.type
    );

    console.log("Esperando resultado del análisis...");
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    console.log("Análisis completado:", {
      detectedIngredients: result.detectedIngredients?.length || 0,
      missingIngredients: result.missingIngredients?.length || 0,
      suggestions: result.suggestions?.length || 0
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("=== ERROR EN ANÁLISIS ===");
    console.error("Error analizando ingredientes:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Error al analizar la imagen", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
