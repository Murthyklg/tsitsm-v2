# Asset Management Database Schema

This document describes the Firestore data model for asset management.

## Assets Collection

Each asset document should contain the following fields (all marked important/required):

- `id` (string): Firestore document ID (required)
- `employeeId` (string): Assigned employee identifier (required)
- `employeeName` (string): Assigned employee name (required)
- `department` (string): Department or business unit (required)
- `location` (string): Physical location of the asset (required)
- `owner` (string): Firebase user UID that owns or manages the asset (required)
- `category` (enum): Asset category such as `laptop`, `desktop`, `monitor`, `printer`, `network`, `peripheral`, `other` (required)
- `serialNumber` (string): Manufacturer serial number (required)
- `manufacturer` (string): Hardware manufacturer (required)
- `ownership` (enum): `company` | `vendor` — mark whether this is a company asset or vendor asset (required)
- `vendorName` (string): Vendor name (required only if `ownership` is `vendor`)
- `model` (string): Product model name or number (required)
- `purchaseDate` (timestamp): Date asset was acquired (required)
- `purchasePrice` (number): Cost at purchase (required)
- `warrantyExpiration` (timestamp): Warranty expiration date (required)
- `condition` (enum): `new`, `good`, `fair`, `poor`, `retired` (required)
- `status` (enum): `active`, `inactive`, `maintenance`, `retired` (required)
- `cpuManufacturer` (string): CPU maker (required)
- `cpuModel` (string): CPU model name (required)
- `cpuGeneration` (string): CPU generation or series (required)
- `ramType` (string): RAM type such as `DDR4`, `DDR5` (required)
- `ramSizeGb` (number): RAM capacity in GB (required)
- `storageType` (enum): `HDD`, `SSD`, `NVMe`, `eMMC`, `other` (required)
- `storageCapacityGb` (number): Storage size in GB (required)
- `os` (string): Operating system (required)
- `operatingSystemVersion` (string): OS version (required)
- `macAddress` (string): Primary MAC address (required)
- `purchaseOrderNumber` (string): PO or order number (required)
- `notes` (string): Additional asset notes (required)
- `imageUrl` (string): Asset photo or attachment URL (required)
- `tags` (array): Tags for filtering and grouping (required)
- `createdAt` (timestamp): Document creation time (required)
- `updatedAt` (timestamp): Document last updated time (required)

## Example Asset Document

```json
{
  "employeeId": "E12345",
  "employeeName": "Asha Kumar",
  "department": "Engineering",
  "location": "Mumbai Office",
  "owner": "userUid123",
  "category": "laptop",
  "serialNumber": "SN12345XYZ",
  "manufacturer": "Dell",
  "ownership": "company",
  "vendorName": "",
  "model": "Latitude 7540",
  "purchaseDate": "2025-11-01T00:00:00.000Z",
  "purchasePrice": 125000,
  "warrantyExpiration": "2027-11-01T00:00:00.000Z",
  "condition": "good",
  "status": "active",
  "cpuManufacturer": "Intel",
  "cpuModel": "Core i7-1365U",
  "cpuGeneration": "13th Gen",
  "ramType": "DDR5",
  "ramSizeGb": 16,
  "storageType": "NVMe",
  "storageCapacityGb": 512,
  "os": "Windows 11 Pro",
  "operatingSystemVersion": "23H2",
  "macAddress": "00:1A:2B:3C:4D:5E",
  "purchaseOrderNumber": "PO-2025-0987",
  "notes": "Assigned as primary laptop for senior engineer.",
  "imageUrl": "https://example.com/assets/asset-2026-001.jpg",
  "tags": ["engineering", "laptop", "priority"],
  "createdAt": "2025-11-01T10:15:00.000Z",
  "updatedAt": "2026-05-30T08:00:00.000Z"
}
```

## Users Collection

Each user document should contain:

- `uid` (string)
- `email` (string)
- `displayName` (string)
- `role` (`admin` | `user`)
- `createdAt` (timestamp)
