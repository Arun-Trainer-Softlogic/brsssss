import "dotenv/config";

export default (req) => {

    const targetsys = {
        DEST: "MME",
        ashost: process.env.ASHOST,
        sysnr: process.env.SYSNR,
        client: process.env.CLIENT,
        lang: process.env.LANGU,
    };

    if (req[`${process.env.TOKEN}`]) {
        targetsys.user = process.env.SAPUSER;
        targetsys.passwd = process.env.SAPPSW;
    } else {
        const credentials = new Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
        if (credentials) {
            targetsys.user = credentials.split(":")[0];
            targetsys.passwd = credentials.split(":")[1];
        }
    }

    return targetsys;
}