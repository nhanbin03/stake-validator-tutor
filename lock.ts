import { Asset, deserializeAddress, mConStr0, resolveScriptHash, stringToHex, outputReference, utxoToTxIn, PlutusData, serializeData, Output, OutputReference, mScript, mCredential } from "@meshsdk/core";
import { getScript, getScriptWithParams, getTxBuilder, wallet } from "./common";
import { toPlutusData } from "@meshsdk/core-cst";
import { blake2b } from "@cardano-sdk/crypto";

async function main() {
    try {
        // get utxo and wallet address
        const utxos = await wallet.getUtxos();
        console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const collateral = await wallet.getCollateral();
        console.log(`Collateral: ${JSON.stringify(collateral, null, 2)}`);
        const walletAddress = (await wallet.getUsedAddresses())[0];

        console.log(`Wallet Address: ${walletAddress}`);

        // console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const inputTxHash = utxos[0].input.txHash;
        const inputOutputIndex = utxos[0].input.outputIndex;

        const signerHash = deserializeAddress(walletAddress).pubKeyHash;

        const { scriptCbor: stakingScriptCbor } = getScript(2);
        const { scriptAddr } = getScriptWithParams(0, [
            mCredential(resolveScriptHash(stakingScriptCbor, "V3"), true)
        ]);

        console.log(`Script Address: ${scriptAddr}`);

        const assets: Asset[] = [
            {
                unit: "lovelace",
                quantity: "2000000",
            }
        ];

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        await txBuilder
            .txIn(inputTxHash, inputOutputIndex)
            .txOut(scriptAddr, assets) // send assets to the script address
            .requiredSignerHash(signerHash)
            .changeAddress(walletAddress) // send change back to the wallet address
            .selectUtxosFrom(utxos)
            .complete();
        const unsignedTx = txBuilder.txHex;
        // console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        console.log(`Signed transaction: ${signedTx}`);
        const txHash = await wallet.submitTx(signedTx);
        console.log(`Tx submitted: ${txHash}`);
    } catch (error) {
        console.error("Error during transaction:", error);
    }
}

main();

// run with `npx tsx lock.ts`