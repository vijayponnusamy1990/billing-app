export function numberToWords(n: number): string {
    const num = Math.round(n);
    if (num === 0) return "Zero Rupees Only";

    const a = [
        "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
        "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/;

    const getLT20 = (n: number) => a[n];
    const get20Plus = (n: number) => b[Math.floor(n / 10)] + " " + a[n % 10];

    function recurse(n: number): string {
        if (n < 20) return getLT20(n);
        if (n < 100) return get20Plus(n);
        if (n < 1000) return getLT20(Math.floor(n / 100)) + "Hundred " + recurse(n % 100);
        if (n < 100000) return recurse(Math.floor(n / 1000)) + "Thousand " + recurse(n % 1000);
        if (n < 10000000) return recurse(Math.floor(n / 100000)) + "Lakh " + recurse(n % 100000);
        return recurse(Math.floor(n / 10000000)) + "Crore " + recurse(n % 10000000);
    }

    let output = recurse(num);
    // Cleanup extra spaces
    output = output.replace(/\s+/g, ' ').trim();

    return output + " Rupees Only";
}
