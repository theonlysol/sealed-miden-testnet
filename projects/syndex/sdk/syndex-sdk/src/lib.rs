use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug)]
pub struct Institution {
    pub institution_id: u64,
    pub schema_hash: [u64; 4],
}

#[derive(Clone, Debug)]
pub struct GradientUpdate {
    pub institution_id: u64,
    pub gradient_hash: [u64; 4],
    pub validity_proof_hash: [u64; 4],
    pub timestamp: u64,
}

#[derive(Clone, Debug)]
pub struct ModelState {
    pub model_root: [u64; 4],
    pub participant_count: u32,
    pub last_updated: u64,
}

#[derive(Clone, Debug)]
pub struct SyndexClient {
    pub institution: Option<Institution>,
    pub model_state: ModelState,
    pub gradient_history: Vec<GradientUpdate>,
    pub account_id: u64,
}

impl SyndexClient {
    pub fn new(account_id: u64) -> Self {
        Self {
            institution: None,
            model_state: ModelState {
                model_root: [0; 4],
                participant_count: 0,
                last_updated: current_unix_timestamp(),
            },
            gradient_history: Vec::new(),
            account_id,
        }
    }

    pub fn register_institution(
        &mut self,
        institution_id: u64,
        schema_hash: [u64; 4],
    ) -> Result<(), String> {
        if self.institution.is_some() {
            return Err("institution already registered".to_string());
        }

        self.institution = Some(Institution {
            institution_id,
            schema_hash,
        });
        Ok(())
    }

    pub fn submit_gradient_update(
        &mut self,
        gradient_hash: [u64; 4],
        validity_proof_hash: [u64; 4],
    ) -> Result<(), String> {
        let institution = self
            .institution
            .as_ref()
            .ok_or_else(|| "institution not registered".to_string())?;

        let timestamp = current_unix_timestamp();
        let update = GradientUpdate {
            institution_id: institution.institution_id,
            gradient_hash,
            validity_proof_hash,
            timestamp,
        };

        if !self.verify_gradient_validity(&update) {
            return Err("invalid gradient update".to_string());
        }

        self.gradient_history.push(update);

        for (idx, value) in gradient_hash.iter().enumerate() {
            self.model_state.model_root[idx] ^= *value;
        }

        self.model_state.participant_count = self
            .model_state
            .participant_count
            .saturating_add(1);
        self.model_state.last_updated = timestamp;

        Ok(())
    }

    pub fn pull_model(&self) -> ModelState {
        self.model_state.clone()
    }

    pub fn generate_advice_stack(&self) -> Vec<u64> {
        if let Some(last) = self.gradient_history.last() {
            let mut stack = Vec::with_capacity(9);
            for value in last.validity_proof_hash.iter().rev() {
                stack.push(*value);
            }
            for value in last.gradient_hash.iter().rev() {
                stack.push(*value);
            }
            stack.push(last.institution_id);
            stack
        } else if let Some(institution) = &self.institution {
            vec![institution.institution_id]
        } else {
            Vec::new()
        }
    }

    pub fn verify_gradient_validity(&self, update: &GradientUpdate) -> bool {
        let institution = match &self.institution {
            Some(institution) => institution,
            None => return false,
        };

        let gradient_non_zero = update.gradient_hash.iter().any(|value| *value != 0);
        let proof_non_zero = update
            .validity_proof_hash
            .iter()
            .any(|value| *value != 0);
        let institution_match = update.institution_id == institution.institution_id;

        gradient_non_zero && proof_non_zero && institution_match
    }
}

fn current_unix_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}
