import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (
                /* pathname */
            ) => {
                /**
                 * Generate a token for the client to upload the file.
                 * You can perform authorization here.
                 */
                return {
                    allowedContentTypes: [
                        "audio/mp3",
                        "audio/mp4",
                        "audio/mpeg",
                        "audio/mpga",
                        "audio/m4a",
                        "audio/wav",
                        "audio/webm",
                    ],
                    tokenPayload: JSON.stringify({
                        // optional, sent to your server on upload completion
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Get notified of client upload completion
                console.log("Blob upload completed", blob, tokenPayload);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 } // The request body is invalid or some other error occurred
        );
    }
}
