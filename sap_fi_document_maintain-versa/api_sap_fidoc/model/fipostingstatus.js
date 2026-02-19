import mongoose from "mongoose";

const fiDocuSch = new mongoose.Schema({
    _id: { type: String },
    creationDate: { type: Date, default: Date.now },
    requestBody: { type: Object },
    statusCode: { type: Number },
    bapiReturn: { type: Object },
    emailAlert: { type: Boolean },
    key: { type: String },
    type: { type: String },
    sys: { type: String },
    changeDate: { type: Date }
});

const fiDocuResSch = new mongoose.Schema({
    _id: { type: String },
    hashKey: { type: String },
    creationDate: { type: Date, default: Date.now },
});

const fiDocuAlertSchema = new mongoose.Schema({
    _id: { _id: String },
    Comp: { type: String },
    Email: { type: String },
    Date: { type: Date, default: Date.now }
});

const fiDocModel = mongoose.model("fiDocu", fiDocuSch);
const fiDocuConf = mongoose.model("fiDocuConf", fiDocuResSch);
const fiDocuAlert = mongoose.model("fiDocuAlert", fiDocuAlertSchema);
const newObjectId = () => {
    const new_id = new mongoose.Types.ObjectId();
    return new_id?.toString();
}

export { fiDocModel, fiDocuConf, fiDocuAlert, newObjectId };