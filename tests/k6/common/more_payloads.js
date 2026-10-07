export function generateLoginPayload() {
    return JSON.stringify({
        email: "test.merchant@example.com",
        password: "securepassword123"
    });
}

export function generateRiskPayload() {
    return JSON.stringify({
        transaction_id: `txn_${Math.floor(Math.random() * 1000000)}`,
        amount: Math.floor(Math.random() * 5000),
        currency: "USD",
        user_ip: "192.168.1.100",
        device_id: "dev_9999"
    });
}
