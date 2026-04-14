import { connectToDatabase } from "@/lib/db/mongoose";

export async function GET() {
    try {
        await connectToDatabase();
        return Response.json({ ok: true, message: "Mongo connected" });
    } catch (error) {
        return Response.json(
            { ok: false, message: error instanceof Error ? error.message : "DB error" },
            { status: 500 }
        );
    }
}