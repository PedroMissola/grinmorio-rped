const MAX_QUEUE_SIZE = 500;
const RETRY_INTERVAL_MS = 30 * 1000;
const MAX_RETRIES_PER_ITEM = 5;

const queue = [];
let retryTimer = null;
let failureCount = 0;

function enqueue(persistFn, data) {
    if (queue.length >= MAX_QUEUE_SIZE) {
        const dropped = queue.shift();
        console.warn(
            `\x1b[33m[AuditQueue]\x1b[0m Fila cheia (${MAX_QUEUE_SIZE}). ` +
            `Item descartado: ${JSON.stringify(dropped.data).slice(0, 80)}...`
        );
    }

    queue.push({ persistFn, data, retries: 0 });
    failureCount++;

    console.warn(
        `\x1b[33m[AuditQueue]\x1b[0m Item enfileirado. ` +
        `Fila atual: ${queue.length} | Total de falhas: ${failureCount}`
    );

    if (!retryTimer) {
        scheduleRetry();
    }
}

function scheduleRetry() {
    retryTimer = setTimeout(async () => {
        retryTimer = null;
        await processQueue();
    }, RETRY_INTERVAL_MS);
}

async function processQueue() {
    if (queue.length === 0) return;

    console.log(`\x1b[34m[AuditQueue]\x1b[0m Processando fila: ${queue.length} item(s) pendente(s).`);

    const batch = queue.splice(0, queue.length);
    const failed = [];

    for (const item of batch) {
        try {
            await item.persistFn(item.data);
        } catch (err) {
            item.retries++;

            if (item.retries < MAX_RETRIES_PER_ITEM) {
                failed.push(item);
            } else {
                console.error(
                    `\x1b[31m[AuditQueue]\x1b[0m Item descartado após ${MAX_RETRIES_PER_ITEM} tentativas: ` +
                    `${JSON.stringify(item.data).slice(0, 80)}`
                );
            }
        }
    }

    if (failed.length > 0) {
        queue.unshift(...failed);
        console.warn(`\x1b[33m[AuditQueue]\x1b[0m ${failed.length} item(s) voltaram para a fila.`);
        scheduleRetry();
    } else {
        console.log('\x1b[32m[AuditQueue]\x1b[0m Fila processada com sucesso.');
    }
}

function getQueueStats() {
    return {
        pendente: queue.length,
        totalFalhas: failureCount
    };
}

module.exports = { enqueue, getQueueStats };