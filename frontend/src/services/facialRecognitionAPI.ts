import { Person, Organization } from "@/types";
import { env } from "@/lib/env";

const API_BASE_URL = env.BACKEND_API_URL;

class FacialRecognitionAPI {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('smallblind_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('smallblind_token', token);
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/facial-recognition${endpoint}`;
    const headers = {
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async initializeOrganization(): Promise<any> {
    return this.request("/initialize", {
      method: "POST",
    });
  }

  async registerPerson(name: string, photos: File[]): Promise<Person> {
    const formData = new FormData();
    formData.append("name", name);

    photos.forEach((photo) => {
      formData.append("photos", photo);
    });

    const response = await fetch(`${API_BASE_URL}/facial-recognition/register`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to register person: ${response.statusText}`);
    }

    const result = await response.json();
    return result.person;
  }

  async getPersons(): Promise<Person[]> {
    const result = await this.request("/persons");
    return result.persons || [];
  }

  async updatePerson(
    id: string,
    name: string,
    photos?: File[],
  ): Promise<Person> {
    const formData = new FormData();
    formData.append("name", name);

    if (photos && photos.length > 0) {
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });
    }

    const response = await fetch(`${API_BASE_URL}/facial-recognition/persons/${id}`, {
      method: "PUT",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to update person: ${response.statusText}`);
    }

    const result = await response.json();
    return result.person;
  }

  async deletePerson(id: string): Promise<void> {
    await this.request(`/persons/${id}`, {
      method: "DELETE",
    });
  }

  async recognizeFace(imageFile: File, threshold: number = 0.5): Promise<any> {
    console.log(`Preparing to recognize face, threshold: ${threshold}, image size: ${imageFile.size} bytes`);
    
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("threshold", threshold.toString());

    console.log("Sending face recognition request to backend...");
    
    const response = await fetch(`${API_BASE_URL}/facial-recognition/recognize`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    console.log(`Face recognition response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Face recognition error response:", errorText);
      throw new Error(`Face recognition failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Face recognition parsed response:", JSON.stringify(result, null, 2));
    return result;
  }

  async getConfig(): Promise<any> {
    return this.request("/config");
  }
}

export const facialRecognitionAPI = new FacialRecognitionAPI();
