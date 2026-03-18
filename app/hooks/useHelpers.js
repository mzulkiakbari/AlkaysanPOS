import { FetchData, getProfile, LoadImageCDN } from "./useFetchData";
import useLocalStorage from "./useLocalStorage";

export const getRefreshToken = async (credential) => {
    try {
        const responseRefreshToken = await FetchData({
            method: 'POST',
            uri: 'https://account.alkaysan.co.id/oauth/token',
            data: {
                'grant_type': 'refresh_token',
                'refresh_token': credential.credential?.data?.refresh_token,
                'client_id': "10",
                'client_secret': "7HkfAQrJUabCFIGGYpDBfDFUCMtZ3pshMlC679Zb",
                'scope': ''
            }
        });

        if (responseRefreshToken) {
            return responseRefreshToken;
        }

        return;
    } catch {
        return;
    }
}

export function GetCurrentLogin() {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('pos_user');
    if (stored) {
        try {
            return {
                isLogin: true,
                profile: JSON.parse(stored),
                credential: localStorage.getItem('pos_credential')
            };
        } catch (e) {
            return null;
        }
    }
    return null;
}


export async function isAuthenticated(accessToken) {
    const getUser = await getProfile(accessToken);
    return getUser && getUser.isAdmin ? getUser : null;
}

export const VerifyCDNFiles = async (file) => {
    try {
        // Jika file sudah objek, lewati parsing
        let parseFile;

        if (typeof file === 'string') {
            // Cek apakah file string yang dapat diparse ke JSON
            try {
                parseFile = JSON.parse(file);
            } catch (error) {
                // Jika parsing gagal, berarti ini bukan JSON. Cek apakah URL langsung atau base64
                if (file.startsWith('http') || file.startsWith('data:image')) {
                    // Jika file adalah URL langsung atau base64, return apa adanya
                    return file;
                }
            }
        } else if (typeof file === 'object') {
            parseFile = file; // file sudah berupa objek
        }

        // Jika parseFile adalah objek valid dan ada properti url
        if (parseFile && typeof parseFile === 'object' && parseFile.url) {
            const response = await LoadImageCDN(parseFile.url);
            return response;
        }

        return file; // Kembalikan file asli jika tidak memenuhi kondisi
    } catch {
        return file;
    }
}

export const FormatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export const RoundUp = (amount) => {
    return Math.ceil(amount * 2) / 2;
}

export const GetLocalDate = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const GenerateProductCode = (name) => {
    return name.split(' ') // Pecah kalimat berdasarkan spasi
        .map(word => {
            // Bersihkan karakter non-huruf (opsional)
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');

            if (cleanWord.length === 0) return "";
            if (cleanWord.length === 1) return cleanWord;
            if (cleanWord.length === 2) return cleanWord;

            const first = cleanWord[0];
            const last = cleanWord[cleanWord.length - 1];

            // Ambil posisi tengah (pembulatan ke bawah jika genap)
            const midIndex = Math.floor((cleanWord.length - 1) / 2);
            const mid = cleanWord[midIndex];

            // Gabungkan dan ubah ke uppercase (opsional)
            return (first + mid + last).toUpperCase();
        })
        .filter(part => part !== "") // Buang string kosong jika ada spasi ganda
        .join('-'); // Gabungkan dengan tanda hubung
}