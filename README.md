# Secure Student Transcript System

**Multi-Cryptography and Group-based Decryption Implementation**

A secure academic transcript management system implementing multiple cryptographic algorithms including AES encryption, RSA digital signatures, Shamir's Secret Sharing, and RC4 PDF encryption.

## How to Run the Application

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Database (PostgreSQL/MySQL)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd secure-transcript-system
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:

   ```env
   DATABASE_URL=your_database_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run database migrations**:

   ```bash
   npm run db:migrate
   # or setup your database schema
   ```

5. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open in browser**:
   ```
   http://localhost:3000
   ```

## Task Assignment

| No  | Task                                 | Assignee              | NIM      |
| --- | ------------------------------------ | --------------------- | -------- |
| 1   | **Autentikasi Pengguna**             | Fatih Nararya R. I.   | 13521060 |
| 2   | **Role-based Access Control (RBAC)** | Akbar Maulana Ridho   | 13521093 |
| 3   | **Input Data Akademik**              | Akbar Maulana Ridho   | 13521093 |
| 4   | **Enkripsi Kolom Data**              | Akbar Maulana Ridho   | 13521093 |
| 5   | **Shamir's Secret Sharing**          | Akbar Maulana Ridho   | 13521093 |
| 6   | **Tanda Tangan Digital**             | Jazmy Izzati Alamsyah | 18221124 |
| 7   | **Dekripsi dan Group-based Access**  | Fatih Nararya R. I.   | 13521060 |
| 8   | **Laporan Transkrip Akademik**       | Jazmy Izzati Alamsyah | 18221124 |
| 9   | **Bonus SHA-3**                      | Jazmy Izzati Alamsyah | 18221124 |
