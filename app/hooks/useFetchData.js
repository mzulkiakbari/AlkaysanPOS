import axios from 'axios';

export async function FetchData({
    method,
    uri = '',
    data,
    hasToken = null
}) {
    try {
        let response;

        const axiosInit = {
            headers: {
                withCredentials: false,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        axiosInit.headers = {
            ...axiosInit.headers,
            ...(hasToken && { 'Authorization': `Bearer ${hasToken}` })
        }

        if (method === 'GET') {
            response = await axios.get(uri, axiosInit);
        }

        if (method === 'POST') {
            response = await axios.post(uri, data, axiosInit);
        }

        if (method === 'PUT') {
            response = await axios.put(uri, data, axiosInit);
        }

        if (method === 'DELETE') {
            response = await axios.delete(uri, axiosInit);
        }

        if (method === 'PATCH') {
            response = await axios.patch(uri, data, axiosInit);
        }

        if (response?.data?.ok === false && response?.data?.message?.includes('access token')) {
            // Attempt to refresh token
            try {
                const refreshRes = await axios.post('/api/auth/refresh');
                if (refreshRes.data.ok) {
                    // Retry original request
                    // Note: We don't have the new token here in JS because it's httpOnly,
                    // but subsequent requests to our own API will use it.
                    // If we are calling external API, we might need a way to get the new token
                    // OR we should be calling our own proxy API always.

                    // For now, let's assume we retry and if it's proxy it works.
                    // If it's direct to alkalysan, we might have a problem if it's client-side.
                    return await FetchData({ method, uri, data, hasToken });
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // If refresh fails or not attempted, return the unauthorized response
            // or trigger a logout event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }

        return response?.data;
    } catch (error) {
        if (error.response?.data?.ok === false && error.response?.data?.message?.includes('access token')) {
            // Try refresh here too if status was 401
            try {
                const refreshRes = await axios.post('/api/auth/refresh');
                if (refreshRes.data.ok) {
                    return await FetchData({ method, uri, data, hasToken });
                }
            } catch (refreshError) {
                console.error('Token refresh failed after error status:', refreshError);
            }

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            return error.response.data;
        }
        return error instanceof TypeError && error.message === 'Failed to fetch' ? 'Koneksi internet terputus.' : 'Terjadi kesalahan.'
    }
}

export async function LoadImageCDN(uri) {
    try {
        const response = await axios.get(uri);
        // Jika request berhasil, kita bisa mengakses data di response.data
        return response.data.results.files.original; // return data yang diterima
    } catch (error) {
        // Menangkap dan menangani error dari axios
        if (error.response) {
            // Server merespon dengan status di luar range 2xx
            console.error('Error Response:', error.response.data);
            console.error('Error Status:', error.response.status);
            console.error('Error Headers:', error.response.headers);
        } else if (error.request) {
            // Request dibuat tapi tidak ada respons dari server
            console.error('Error Request:', error.request);
        } else {
            // Error lain yang terjadi saat setting request
            console.error('General Error:', error.message);
        }

        return null; // Atau kembalikan nilai default jika error terjadi
    }
}

export const getProfile = async (accessToken) => {
    try {
        const response = await FetchData({
            method: 'GET',
            uri: 'https://api.alkaysan.co.id/v2/account/user/get/me',
            hasToken: accessToken && accessToken
        });

        if (response) {
            return response;
        }

        return;
    } catch {
        return;
    }
}