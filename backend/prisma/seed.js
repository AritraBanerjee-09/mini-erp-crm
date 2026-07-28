"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed for Mini ERP + CRM Portal...');
    // 1. Clean existing records
    await prisma.invoice.deleteMany({});
    await prisma.challanItem.deleteMany({});
    await prisma.salesChallan.deleteMany({});
    await prisma.stockLog.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customerFollowUp.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    const passwordHash = await bcryptjs_1.default.hash('Password123', 10);
    // 2. Create Users
    const admin = await prisma.user.create({
        data: {
            email: 'admin@minierp.com',
            passwordHash,
            name: 'Alex Rivera (Admin)',
            role: 'ADMIN'
        }
    });
    const salesUser = await prisma.user.create({
        data: {
            email: 'sales@minierp.com',
            passwordHash,
            name: 'Sarah Connor (Sales Lead)',
            role: 'SALES'
        }
    });
    const warehouseUser = await prisma.user.create({
        data: {
            email: 'warehouse@minierp.com',
            passwordHash,
            name: 'Marcus Vance (Warehouse Mgr)',
            role: 'WAREHOUSE'
        }
    });
    const accountsUser = await prisma.user.create({
        data: {
            email: 'accounts@minierp.com',
            passwordHash,
            name: 'Elena Rostova (Head Accounts)',
            role: 'ACCOUNTS'
        }
    });
    console.log('✅ 4 Role-based Users created (admin, sales, warehouse, accounts)');
    // 3. Create Customers
    const customer1 = await prisma.customer.create({
        data: {
            name: 'Rajesh Sharma',
            mobile: '+91 9876543210',
            email: 'rajesh@apexdistributors.in',
            businessName: 'Apex Wholesale & Distributors',
            gstNumber: '27AAAAA0000A1Z5',
            customerType: 'Distributor',
            address: 'Plot 42, Industrial Zone 2, Mumbai, Maharashtra 400018',
            status: 'Active',
            followUpDate: new Date('2026-08-05'),
            notes: 'Key distributor for Western region. Prefers 30-day payment terms.'
        }
    });
    const customer2 = await prisma.customer.create({
        data: {
            name: 'Anita Desai',
            mobile: '+91 9123456789',
            email: 'anita@metroretails.com',
            businessName: 'Metro Retail Marts Ltd',
            gstNumber: '07BBBBB1111B2Z3',
            customerType: 'Wholesale',
            address: 'Suite 801, Corporate Heights, Connaught Place, New Delhi 110001',
            status: 'Active',
            followUpDate: new Date('2026-08-01'),
            notes: 'Monthly bulk orders of electrical components.'
        }
    });
    const customer3 = await prisma.customer.create({
        data: {
            name: 'Vikram Mehta',
            mobile: '+91 9988776655',
            email: 'vikram@mehtahardware.in',
            businessName: 'Mehta Hardware & Tools',
            gstNumber: undefined,
            customerType: 'Retail',
            address: 'Shop 14, Main Market, Bangalore, Karnataka 560001',
            status: 'Lead',
            followUpDate: new Date('2026-07-30'),
            notes: 'New lead from Trade Expo 2026. Interested in trial shipment of 50 units.'
        }
    });
    const customer4 = await prisma.customer.create({
        data: {
            name: 'Suresh Patel',
            mobile: '+91 9765432109',
            email: 'suresh@pateltraders.com',
            businessName: 'Patel Enterprise',
            gstNumber: '24CCCCC2222C3Z4',
            customerType: 'Wholesale',
            address: 'Ring Road, Surat, Gujarat 395002',
            status: 'Inactive',
            notes: 'No purchases in last 6 months. Pending clearance.'
        }
    });
    console.log('✅ 4 Sample Customers created across Lead, Active, Inactive statuses');
    // Create Follow-up notes
    await prisma.customerFollowUp.create({
        data: {
            customerId: customer3.id,
            note: 'Called client regarding initial inquiry for industrial connectors. Sent catalog via email.',
            createdById: salesUser.id
        }
    });
    // 4. Create Products
    const prod1 = await prisma.product.create({
        data: {
            name: 'Heavy Duty Power Inverter 3KVA',
            sku: 'PWR-INV-3KVA',
            category: 'Electronics & Power',
            unitPrice: 14500,
            currentStock: 45,
            minStockAlert: 10,
            location: 'Warehouse A - Aisle 3'
        }
    });
    const prod2 = await prisma.product.create({
        data: {
            name: 'Industrial Cable Drum 100m',
            sku: 'CBL-DRM-100M',
            category: 'Cables & Wiring',
            unitPrice: 3200,
            currentStock: 8, // Low stock! Alert threshold is 10
            minStockAlert: 10,
            location: 'Warehouse B - Rack 12'
        }
    });
    const prod3 = await prisma.product.create({
        data: {
            name: 'Digital Multimeter Pro',
            sku: 'TL-DMM-PRO',
            category: 'Test Tools',
            unitPrice: 1850,
            currentStock: 120,
            minStockAlert: 15,
            location: 'Warehouse A - Aisle 1'
        }
    });
    const prod4 = await prisma.product.create({
        data: {
            name: 'Lithium Battery Pack 48V 100Ah',
            sku: 'BAT-LFP-48V',
            category: 'Energy Storage',
            unitPrice: 42000,
            currentStock: 4, // Critical stock! Alert threshold is 5
            minStockAlert: 5,
            location: 'Warehouse C - Secure Bay'
        }
    });
    console.log('✅ 4 Products created with low-stock alerts');
    // Initial Stock Logs
    await prisma.stockLog.createMany({
        data: [
            {
                productId: prod1.id,
                quantityChanged: 50,
                movementType: 'IN',
                reason: 'Initial Factory Delivery Purchase Order #101',
                createdById: warehouseUser.id
            },
            {
                productId: prod2.id,
                quantityChanged: 20,
                movementType: 'IN',
                reason: 'Restock shipment received',
                createdById: warehouseUser.id
            },
            {
                productId: prod3.id,
                quantityChanged: 150,
                movementType: 'IN',
                reason: 'Bulk stock arrival from manufacturer',
                createdById: warehouseUser.id
            }
        ]
    });
    // 5. Create Sample Sales Challan & Invoice
    const customerSnapshot = JSON.stringify({
        id: customer1.id,
        name: customer1.name,
        businessName: customer1.businessName,
        mobile: customer1.mobile,
        email: customer1.email,
        gstNumber: customer1.gstNumber,
        address: customer1.address
    });
    const prod1Snapshot = JSON.stringify({
        id: prod1.id,
        name: prod1.name,
        sku: prod1.sku,
        category: prod1.category,
        unitPrice: prod1.unitPrice,
        location: prod1.location
    });
    const sampleChallan = await prisma.salesChallan.create({
        data: {
            challanNumber: 'CH-202607-0001',
            customerId: customer1.id,
            customerSnapshotJson: customerSnapshot,
            totalQuantity: 5,
            totalAmount: 72500,
            status: 'Confirmed',
            createdById: salesUser.id,
            items: {
                create: [
                    {
                        productId: prod1.id,
                        productSnapshotJson: prod1Snapshot,
                        quantity: 5,
                        unitPrice: 14500,
                        lineTotal: 72500
                    }
                ]
            }
        }
    });
    // Create invoice for sample confirmed challan
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    await prisma.invoice.create({
        data: {
            invoiceNumber: 'INV-202607-0001',
            salesChallanId: sampleChallan.id,
            customerId: customer1.id,
            totalAmount: 72500,
            status: 'Pending',
            dueDate
        }
    });
    console.log('✅ Sample Confirmed Sales Challan & Invoice seeded.');
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
