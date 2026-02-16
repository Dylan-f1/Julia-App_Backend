router.post('/consent/accept', authenticatePatient, async (req, res) => {
  try {
    const consent = new DataConsent({
      patientId: req.patient._id,
      consentGiven: true,
      consentDate: new Date(),
      ipAddress: req.ip,
      version: '1.0'
    });

    await consent.save();

    // Mettre à jour le profil patient
    await Patient.findByIdAndUpdate(req.patient._id, {
      dataConsentGiven: true,
      dataConsentDate: new Date()
    });

    res.json({ success: true, message: 'Consentement enregistré' });
  } catch (error) {
    console.error('Erreur enregistrement consentement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/consent/withdraw', authenticatePatient, async (req, res) => {
  try {
    const { reason } = req.body;

    await DataConsent.findOneAndUpdate(
      { patientId: req.patient._id, consentGiven: true },
      {
        consentGiven: false,
        withdrawnDate: new Date(),
        withdrawnReason: reason
      }
    );

    await Patient.findByIdAndUpdate(req.patient._id, {
      dataConsentGiven: false
    });

    res.json({ success: true, message: 'Consentement retiré' });
  } catch (error) {
    console.error('Erreur retrait consentement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});