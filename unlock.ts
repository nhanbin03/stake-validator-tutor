import {
    deserializeAddress,
    mConStr0,
    stringToHex,
    outputReference,
    resolveScriptHash,
    utxoToTxIn,
    resolveScriptHashDRepId,
    applyCborEncoding,
    resolveRewardAddress,
    mOutputReference,
    mScript,
    mCredential
} from "@meshsdk/core";
import { getScript, getScriptWithParams, getStakingScript, getTxBuilder, getUtxoByTxHash, wallet } from "./common";

async function main() {
    try {
        // get utxo, collateral and address from wallet
        const utxos = await wallet.getUtxos();
        console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const walletAddress = (await wallet.getUsedAddresses())[0];
        const collateral = await wallet.getCollateral();
        console.log(`Collateral: ${JSON.stringify(collateral, null, 2)}`);
        
        const { scriptAddr: stakingScriptAddress, scriptCbor: stakingScriptCbor } = getStakingScript(2);
        console.log(`Staking Script Address: ${stakingScriptAddress}`);
        const { scriptCbor: spendingScriptCbor } = getScriptWithParams(0, [
            mCredential(resolveScriptHash(stakingScriptCbor, "V3"), true)
        ]);
        console.log(`Script: ${resolveScriptHash(stakingScriptCbor, "V3")}`)

        const signerHash = deserializeAddress(walletAddress).pubKeyHash;

        // get the utxo from the script address of the locked funds
        const txHashFromDeposit = process.argv[2];
        const scriptUtxo = await getUtxoByTxHash(txHashFromDeposit);

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        await txBuilder
            .spendingPlutusScriptV3()
            .withdrawalPlutusScriptV3()
            .txIn(
                scriptUtxo.input.txHash,
                scriptUtxo.input.outputIndex,
            )

            .txInScript(spendingScriptCbor)
            .txInInlineDatumPresent()
            // .txInDatumValue(mConStr0())
            .txInRedeemerValue(mConStr0([]))

            .withdrawal(stakingScriptAddress, "0")
            .withdrawalScript(stakingScriptCbor)
            .withdrawalRedeemerValue(mConStr0([]))

            .requiredSignerHash(signerHash)
            .changeAddress(walletAddress)
            .txInCollateral(...utxoToTxIn(collateral[0]!))
            .selectUtxosFrom(utxos)
            .complete();

        const unsignedTx = txBuilder.txHex;
        console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        console.log(`Signed transaction: ${signedTx}`);
        const txHash = await wallet.submitTx(signedTx);
        console.log(`Tx submitted: ${txHash}`);
    } catch (error) {
        console.error("Error unlocking:", error);
    }
}

main();


// run with `npx tsx unlock.ts <txHashFromDeposit>`
