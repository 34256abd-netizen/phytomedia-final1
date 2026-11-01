import { getAccessToken } from './auth';

export const createMeetSpace = async (): Promise<string> => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('User not authenticated');
  }

  const response = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        accessType: 'OPEN',
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Meet space');
  }

  const data = await response.json();
  return data.meetingUri;
};
