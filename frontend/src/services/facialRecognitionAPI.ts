import { Person, Organization } from "@/types";
import { env } from "@/lib/env";

const API_BASE_URL = env.FACIAL_RECOGNITION_API_URL;
("http://localhost:8000/api");

class FacialRecognitionAPI {
  private apiKey: string | null = null;
  private organizationId: string | null = null;

  setCredentials(apiKey: string, organizationId: string) {
    this.apiKey = apiKey;
    this.organizationId = organizationId;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
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

  async createOrganization(name: string): Promise<Organization> {
    return this.request("/organizations", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async registerPerson(name: string, photos: File[]): Promise<Person> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("organizationId", this.organizationId || "");

    photos.forEach((photo, index) => {
      formData.append(`photo_${index}`, photo);
    });

    const response = await fetch(`${API_BASE_URL}/persons`, {
      method: "POST",
      headers: {
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to register person: ${response.statusText}`);
    }

    return response.json();
  }

  async getPersons(): Promise<Person[]> {
    return this.request(`/persons?organizationId=${this.organizationId}`);
  }

  async updatePerson(
    id: string,
    name: string,
    photos?: File[],
  ): Promise<Person> {
    if (photos && photos.length > 0) {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("organizationId", this.organizationId || "");

      photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      const response = await fetch(`${API_BASE_URL}/persons/${id}`, {
        method: "PUT",
        headers: {
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update person: ${response.statusText}`);
      }

      return response.json();
    } else {
      return this.request(`/persons/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    }
  }

  async deletePerson(id: string): Promise<void> {
    await this.request(`/persons/${id}`, {
      method: "DELETE",
    });
  }

  async recognizeFace(imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("organizationId", this.organizationId || "");

    const response = await fetch(`${API_BASE_URL}/recognize`, {
      method: "POST",
      headers: {
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Face recognition failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const facialRecognitionAPI = new FacialRecognitionAPI();
