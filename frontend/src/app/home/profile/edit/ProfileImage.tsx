'use client';

import Image from 'next/image';
import { useState } from 'react';
import { IUserProfile } from '../model';
import { AVATAR_MAX_DIMENSION, resizeAvatarToPngDataUrl } from '@/_lib/resize-avatar';


export default function ProfileImage({
    options
}: {
    options: IUserProfile
}) {

    const [selectedImage, setSelectedImage] = useState(encodeURIComponent("data:image/png;base64, " + options.profileImageBase64))
    const [selectedBase64Image,setSelectedBase64Image] = useState(options.profileImageBase64??'');
    // The picture is scaled down here rather than sent whole: it is displayed in a circle a few
    // dozen pixels across, and what is stored is served to the browser on every page. Any photograph
    // is accepted; the server refuses anything above the same ceiling, from the bytes themselves.
    async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        const file = event.currentTarget.files?.[0];
        if (!file) return;

        try {
            const resized = await resizeAvatarToPngDataUrl(file, AVATAR_MAX_DIMENSION);
            setSelectedBase64Image(resized.split("base64,")[1]);
            setSelectedImage(encodeURIComponent(resized));
        } catch {
            alert("Cette image n'a pas pu être lue. Choisissez une photo au format PNG, JPEG ou WebP.");
        }
    }

    return (
        <div className="col-span-full flex items-center gap-x-8">
            <Image
                alt={`${options.firstName} ${options.lastName}`}
                src={decodeURIComponent(selectedImage)}
                width={100}
                height={100}
                className="size-24 flex-none rounded-lg bg-gray-800 object-cover"
            />
            <div>
                <input type='hidden' name='profileImageBase64' value={selectedBase64Image}></input>
                <input type="file" id='imageUpload' hidden={true} accept="image/*" onChange={handleImageUpload} />
                <button
                    type="button"
                    onClick={() => {
                        document.getElementById('imageUpload')?.click();
                    }}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
                >
                    Change avatar
                </button>
                <p className="mt-2 text-xs/5 text-gray-400">JPG, GIF or PNG. 5MB max.</p>
            </div>
        </div>
    )
}