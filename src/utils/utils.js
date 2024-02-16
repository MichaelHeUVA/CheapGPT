export function calculateTokenCost(
    prompt_tokens,
    completion_tokens,
    number_of_images
) {
    return (
        (prompt_tokens * 0.01) / 1000 +
        (completion_tokens * 0.03) / 1000 +
        number_of_images * 0.00085
    );
}
