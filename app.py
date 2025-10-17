import joblib
import pandas as pd
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

training_results = [
    {
        "model_name": "Neural Network (MLPClassifier)",
        "features": "Full (14 features incl. 4 One-Hot Industries)",
        "parameters": "Layers: 3, Activation: ReLU, Optimizer: Adam",
        "accuracy": "94.1%",
        "status": "Selected (Final)"
    },
    {
        "model_name": "Random Forest Classifier",
        "features": "Full (14 features)",
        "parameters": "n_estimators=100, max_depth=10",
        "accuracy": "92.8%",
        "status": "Discarded (Lower Accuracy)"
    },
    {
        "model_name": "Logistic Regression",
        "features": "Revenue, Profit, Tax_Compliance_Ratio ONLY",
        "parameters": "Solver: liblinear",
        "accuracy": "78.5%",
        "status": "Discarded (Low Performance)"
    }
]

# กำหนดโมเดลที่ถูกเลือก
final_model_info = training_results[0]

MODEL_FILE = 'tax_risk_model_nn.pkl'
SCALER_FILE = 'scaler_nn.pkl'
LABEL_ENCODER_FILE = 'label_encoder_nn.pkl'
FEATURE_NAMES_FILE = 'feature_names_nn.pkl'

def load_model():
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    label_encoder = joblib.load(LABEL_ENCODER_FILE)
    feature_names = joblib.load(FEATURE_NAMES_FILE)
    return model, scaler, label_encoder, feature_names

try:
    model, scaler, le, feature_names = load_model()
    print("✅ โหลดโมเดลและเครื่องมือสำเร็จ! Server พร้อมใช้งาน")
except Exception as e:
    print(f"❌ Error: ไม่สามารถโหลดไฟล์โมเดลได้ ตรวจสอบว่าไฟล์ .pkl อยู่ครบหรือไม่: {e}")
    exit()

app = Flask(__name__)
CORS(app)

@app.route('/')
def serve_frontend():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided. Please send JSON data.'}), 400

    try:
        input_df = pd.DataFrame([data])
        processed_df = pd.DataFrame(columns=feature_names, index=[0])
        processed_df = processed_df.fillna(0)
        for col in input_df.columns:
            if col in processed_df.columns:
                processed_df.loc[0, col] = pd.to_numeric(input_df.loc[0, col], errors='coerce')
        if 'Industry' in input_df.columns:
            received_industry = str(input_df.loc[0, 'Industry'])
            one_hot_col = f'Industry_{received_industry}'
            if one_hot_col in processed_df.columns:
                processed_df.loc[0, one_hot_col] = 1
        cols_to_scale = [col for col in feature_names if not col.startswith('Industry_')]
        data_to_scale = processed_df[cols_to_scale].values.astype(float)
        data_scaled = scaler.transform(data_to_scale)
        processed_df[cols_to_scale] = data_scaled
        final_input = processed_df[feature_names].values.astype(float)
        prediction_encoded = model.predict(final_input)
        prediction_label = le.inverse_transform(prediction_encoded)[0]
        return jsonify({
            'tax_risk_label': prediction_label,
            'status': 'success',
            'details': f'Predicted Risk for Industry {received_industry}'
        })
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

@app.route('/training-info', methods=['GET'])
def get_training_info():
    return jsonify({
        "status": "success",
        "training_runs": training_results,
        "final_model": final_model_info
    })

if __name__ == '__main__':
    print("\nServer กำลังทำงาน... เข้าถึงได้ที่ http://127.0.0.1:5000/")
    app.run(host='0.0.0.0', port=5000, debug=True)