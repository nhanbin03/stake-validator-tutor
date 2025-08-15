import {
    deserializeAddress,
    mConStr0,
    stringToHex,
    outputReference,
    resolveScriptHash,
    utxoToTxIn,
    resolveScriptHashDRepId,
    applyCborEncoding
} from "@meshsdk/core";
import { getScript, getStakingScript, getTxBuilder, getUtxoByTxHash, wallet } from "./common";
import { Cardano, DRepID, Hash28ByteBase16 } from "@meshsdk/core-cst";

async function main() {
    try {
        // get utxo, collateral and address from wallet
        const utxos = await wallet.getUtxos();
        console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const walletAddress = (await wallet.getUsedAddresses())[0];
        const collateral = await wallet.getCollateral();
        console.log(`Collateral: ${JSON.stringify(collateral, null, 2)}`);

        const { scriptAddr, scriptCbor } = getStakingScript(2);

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        await txBuilder
            .txIn(...utxoToTxIn(collateral[0]!))
            // .txInScript(scriptCbor)
            .registerStakeCertificate(scriptAddr)
            // .certificateScript(scriptCbor, "V3")
            // .certificateRedeemerValue(mConStr0([]), "Mesh")
            // .requiredSignerHash(signerHash)
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
        console.error("Error registering:", error);
    }
}

main();


// run with `npx tsx reward-register.ts`
