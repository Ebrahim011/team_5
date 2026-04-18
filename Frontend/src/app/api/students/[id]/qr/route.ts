import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { API_URL, TOKEN_KEY } from '@/lib/constants';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * Server-side QR image generator (data URL).
 * It fetches the student (to get `qrToken`) from the backend using the same auth cookie,
 * then renders a QR code image for printing on the success page.
 */
export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const token = (await cookies()).get(TOKEN_KEY)?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const studentRes = await fetch(`${API_URL}/students/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!studentRes.ok) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch student' },
            { status: studentRes.status }
        );
    }

    const json = await studentRes.json();
    const qrToken: string | undefined = json?.data?.qrToken;

    if (!qrToken) {
        return NextResponse.json(
            { success: false, message: 'Student QR token not found' },
            { status: 404 }
        );
    }

    const dataUrl = await QRCode.toDataURL(qrToken, {
        // High resilience + larger modules for easier camera decoding
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 360,
    });

    return NextResponse.json({ success: true, data: { qrDataUrl: dataUrl } });
}


