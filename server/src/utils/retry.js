function wait(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export async function retry(
    fn,
    retries,
    delay
) {
    try {
        return await fn();

    } catch (error) {
        if (retries <= 0) {
            throw error;
        }

        await wait(delay);

        return retry(
            fn,
            retries - 1,
            delay * 2
        );
    }
}