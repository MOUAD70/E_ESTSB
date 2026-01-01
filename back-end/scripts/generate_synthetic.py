import pandas as pd
import random
import numpy as np
import os

random.seed(42)
np.random.seed(42)

num_samples = 15000

diplomes = ["DUT", "BTS", "DEUG", "DEUST", "DTS"]
branches = [
    "INFRASTRUCTURE DIGITAL", "DEVELOPPEMENT DIGITAL", "GENIE INFORMATIQUE",
    "SMI", "RÉSEAUX ET TÉLÉCOMS", "GESTION DES ENTREPRISES",
    "TECHNIQUES DE MANAGEMENT", "ECONOMIE", "COMPTABILITÉ",
    "AGRONOMIE", "AGRO-ALIMENTAIRE", "SCIENCES DE LA VIE", "ENVIRONNEMENT"
]
bac_types = ["SCIENCE", "ECO", "TECH", "LETTRES"]
filieres = ["Bachelor ISITW", "Bachelor CSTC", "Bachelor BDAPA", "Bachelor CCA", "Bachelor GCF"]

# filiere difficulty (bigger = harder)
filiere_bias = {
    "Bachelor ISITW": 0.06,
    "Bachelor CSTC": 0.10,
    "Bachelor BDAPA": 0.04,
    "Bachelor CCA": 0.05,
    "Bachelor GCF": 0.05
}

# diploma slight advantage
diplome_bonus = {"DTS": 0.03, "DUT": 0.02, "BTS": 0.01, "DEUG": 0.00, "DEUST": 0.00}

# bac type slight advantage (optional)
bac_bonus = {"SCIENCE": 0.02, "TECH": 0.01, "ECO": 0.00, "LETTRES": -0.01}

# branch match advantage per filiere (simple mapping)
branch_match = {
    "Bachelor ISITW": {"INFRASTRUCTURE DIGITAL", "DEVELOPPEMENT DIGITAL", "GENIE INFORMATIQUE", "SMI", "RÉSEAUX ET TÉLÉCOMS"},
    "Bachelor CSTC": {"INFRASTRUCTURE DIGITAL", "RÉSEAUX ET TÉLÉCOMS", "GENIE INFORMATIQUE", "SMI"},
    "Bachelor BDAPA": {"AGRONOMIE", "AGRO-ALIMENTAIRE", "SCIENCES DE LA VIE", "ENVIRONNEMENT"},
    "Bachelor CCA": {"GESTION DES ENTREPRISES", "TECHNIQUES DE MANAGEMENT", "ECONOMIE", "COMPTABILITÉ"},
    "Bachelor GCF": {"GESTION DES ENTREPRISES", "TECHNIQUES DE MANAGEMENT", "ECONOMIE", "COMPTABILITÉ"},
}

def clip20(x):
    return max(0, min(20, x))

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

rows = []
forced_reject = 0
selected_count = 0

for _ in range(num_samples):
    t_diplome = random.choice(diplomes)
    branche = random.choice(branches)
    bac_type = random.choice(bac_types)
    filiere = random.choice(filieres)

    moy_bac = round(random.uniform(10, 19), 2)  # kept only for DB consistency

    # generate semester marks with correlation (more realistic)
    base_level = np.random.normal(11.7, 2.4)   # student "global level"
    m_s1 = round(clip20(np.random.normal(base_level, 1.8)), 2)
    m_s2 = round(clip20(np.random.normal(base_level, 1.8)), 2)
    m_s3 = round(clip20(np.random.normal(base_level, 2.0)), 2)
    m_s4 = round(clip20(np.random.normal(base_level, 2.0)), 2)

    avg_sem = (m_s1 + m_s2 + m_s3 + m_s4) / 4
    std_sem = np.std([m_s1, m_s2, m_s3, m_s4])        # consistency
    trend = (m_s4 - m_s1) / 20.0                      # improvement

    # 🚫 HARD DISQUALIFICATION
    if avg_sem < 10:
        selected = 0
        forced_reject += 1
    else:
        # base from average
        base = avg_sem / 20.0

        # small bonuses/penalties
        base += diplome_bonus.get(t_diplome, 0.0)
        base += bac_bonus.get(bac_type, 0.0)

        # branch match gives small bonus
        if branche in branch_match.get(filiere, set()):
            base += 0.03
        else:
            base -= 0.02

        # filiere difficulty
        base -= filiere_bias[filiere]

        # penalize instability, reward positive trend
        base -= (std_sem / 20.0) * 0.25   # strong instability lowers probability
        base += trend * 0.08              # improving helps a bit

        # slight noise
        base += np.random.normal(0, 0.01)

        # probability curve
        prob = sigmoid((base - 0.58) * 12)

        selected = 1 if random.random() < prob else 0

    selected_count += selected

    rows.append({
        "t_diplome": t_diplome,
        "branche_diplome": branche,
        "bac_type": bac_type,
        "filiere": filiere,
        "moy_bac": moy_bac,
        "m_s1": m_s1,
        "m_s2": m_s2,
        "m_s3": m_s3,
        "m_s4": m_s4,
        "selected": selected
    })

df = pd.DataFrame(rows)

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)
csv_path = os.path.join(data_dir, "candidates_synthetic.csv")
df.to_csv(csv_path, index=False)

print(f"CSV created: {csv_path}")
print(df.head())
print(f"Forced rejects (avg<10): {forced_reject}/{num_samples} = {forced_reject/num_samples:.2%}")
print(f"Selected overall: {selected_count}/{num_samples} = {selected_count/num_samples:.2%}")
