import { CESS, CESSConfig } from "@/cess";
import { TokenFormatter } from "@cessnetwork/util";
import { TransactionOptions } from "@/utils/tx";
import { AccountInfoData } from '@cessnetwork/types';
import { getMnemonic } from "@/test/config";

async function main() {
    try {
        const config: CESSConfig = {
            name: "CESS-Pre-MainNet",
            rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
            privateKey: getMnemonic(),
            ss58Format: 11330,
            enableEventListener: false,
        };

        const enableQuery = false;
        const enableTx = true;

        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);

        const format = (value: any) => TokenFormatter.formatBalance(value.toString(), client.tokenDecimals, {
            displayDecimals: 4,
            useGrouping: true,
            symbol: 'CESS'
        });

        if (enableQuery) {
            console.log("\n--- Querying Balances Pallet using ChainClient methods ---");

            const balance = await client.queryAccountById(accountAddress) as AccountInfoData;
            console.log(`Balance for ${accountAddress}:`, format(balance.data.free));

            const holds = await client.queryBalanceHoldsByAccountId(accountAddress);
            console.log(`Holds for ${accountAddress}:`, holds);

            const locks = await client.queryBalanceLocksByAccountId(accountAddress);
            console.log(`Locks for ${accountAddress}:`, locks);

            const totalIssuance = await client.queryTotalIssuance();
            console.log('Total Issuance:', totalIssuance);

            const inactiveIssuance = await client.queryInactiveIssuance();
            console.log('Inactive Issuance:', inactiveIssuance);
        }

        if (enableTx) {
            console.log("\n--- Submitting Balances Transactions using ChainClient methods ---");

            const defaultTxOptions: TransactionOptions = {
                waitForFinalization: true,
                timeout: 120000,
            };

            const destAddress = "cXiS7gAv9XJCjxbpzhWtcXEEku1JexrT1uxzKdoygDx8wdoVL"; // A sample destination
            const transferAmount = BigInt(10 ** 18); // 1 TCESS in minimal units

            // 1. transferKeepAlive
            console.log(`\n1. Testing transferKeepAlive`);
            console.log(`   From: ${accountAddress}`);
            console.log(`   To: ${destAddress}`);
            console.log(`   Amount: ${format(transferAmount)}`);

            try {
                const balanceBeforeStr = await client.queryAccountById(accountAddress) as AccountInfoData;
                const balanceBefore = balanceBeforeStr.data.free;
                console.log(`   Sender balance before: ${format(balanceBefore)}`);

                const result = await client.transferKeepAlive(
                    destAddress,
                    transferAmount,
                    defaultTxOptions
                );

                if (result.success) {
                    console.log('✅ Transfer successful!', {txHash: result.txHash, blockHash: result.blockHash});
                    const balanceAfterStr = await client.queryAccountById(accountAddress) as AccountInfoData;
                    const balanceAfter = balanceAfterStr.data.free;
                    console.log(`   Sender balance after: ${format(balanceAfter)}`);
                } else {
                    console.error('❌ Transfer failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during transfer:', error);
            }

            // 2. burn
            const burnAmount = BigInt(10 ** 18); // 0.001 TCESS
            console.log(`\n2. Testing burn`);
            console.log(`   Amount: ${format(burnAmount)}`);
            try {
                const balanceBeforeStr = await client.queryAccountById(accountAddress) as AccountInfoData;
                const balanceBefore = balanceBeforeStr.data.free;
                console.log(`   Sender balance before: ${format(balanceBefore)}`);

                const result = await client.burn(
                    burnAmount,
                    true, // keepAlive = false
                    defaultTxOptions
                );

                if (result.success) {
                    console.log('✅ Burn successful!', {txHash: result.txHash, blockHash: result.blockHash});
                    const balanceAfterStr = await client.queryAccountById(accountAddress) as AccountInfoData;
                    const balanceAfter = balanceAfterStr.data.free;
                    console.log(`   Sender balance after: ${format(balanceAfter)}`);
                } else {
                    console.error('❌ Burn failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during burn:', error);
            }

            // 3. batchTransferKeepAlive
            console.log(`\n3. Testing batchTransferKeepAlive`);
            try {
                // Using the same destination for testing
                const recipients = [
                    { dest: "cXi7S87zK2a29Lr48DUJ7d5LixqSXb9tMH84uG2ZPwf5G8DJf", value: BigInt(10 ** 18) }, // 0.001 TCESS
                    { dest: "cXiS7gAv9XJCjxbpzhWtcXEEku1JexrT1uxzKdoygDx8wdoVL", value: BigInt(2 * 10 ** 18) }  // 0.002 TCESS
                ];
                
                console.log(`   Transferring to ${recipients.length} recipients:`);
                recipients.forEach((recipient, index) => {
                    console.log(`     ${index + 1}. ${recipient.dest}: ${format(recipient.value)}`);
                });

                const balanceBeforeStr = await client.queryAccountById(accountAddress) as AccountInfoData;
                const balanceBefore = balanceBeforeStr.data.free;
                console.log(`   Sender balance before: ${format(balanceBefore)}`);

                const result = await client.batchTransferKeepAlive(
                    recipients,
                    defaultTxOptions
                );

                if (result.success) {
                    console.log('✅ Batch transfer successful!', {txHash: result.txHash, blockHash: result.blockHash});
                    const balanceAfterStr = await client.queryAccountById(accountAddress) as AccountInfoData;
                    const balanceAfter = balanceAfterStr.data.free;
                    console.log(`   Sender balance after: ${format(balanceAfter)}`);
                    
                    // Log details about the transfers
                    console.log(`   Transfer count: ${result.transferCount}`);
                    if (result.failedTransfers && result.failedTransfers.length > 0) {
                        console.log(`   Failed transfers: ${result.failedTransfers.length}`);
                        result.failedTransfers.forEach(failed => {
                            console.log(`     Index ${failed.index}: ${failed.error}`);
                        });
                    }
                } else {
                    console.error('❌ Batch transfer failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during batch transfer:', error);
            }
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);