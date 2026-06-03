type ProfilePhotoRole = 'doctor' | 'patient';

type ProfilePhotoUpdate = {
  role: ProfilePhotoRole;
  userId: string;
  profilePhotoUrl: string;
};

const EVENT_NAME = 'hm:profile-photo-updated';

export function emitProfilePhotoUpdate(update: ProfilePhotoUpdate) {
  if (typeof window === 'undefined') return;
  if (!update.userId) return;
  window.dispatchEvent(new CustomEvent<ProfilePhotoUpdate>(EVENT_NAME, { detail: update }));
}

export function subscribeProfilePhotoUpdates(handler: (update: ProfilePhotoUpdate) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ProfilePhotoUpdate>;
    if (!customEvent.detail) return;
    handler(customEvent.detail);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
