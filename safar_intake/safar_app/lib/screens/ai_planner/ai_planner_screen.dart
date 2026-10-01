import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/storage_service.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/safar_button.dart';
import '../../config/theme.dart';

class AIPlannerScreen extends ConsumerStatefulWidget {
  const AIPlannerScreen({super.key});

  @override
  ConsumerState<AIPlannerScreen> createState() => _AIPlannerScreenState();
}

class _AIPlannerScreenState extends ConsumerState<AIPlannerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _destinationController = TextEditingController();
  int _days = 3;
  String _interests = 'Culture & Heritage';
  bool _isGenerating = false;
  Map<String, dynamic>? _generatedPlan;

  Future<void> _generatePlan() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isGenerating = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final plan = await apiService.generateTripPlan(
        destination: _destinationController.text,
        days: _days,
        interests: _interests,
      );
      setState(() => _generatedPlan = plan);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  Future<void> _savePlan() async {
    if (_generatedPlan == null) return;

    await StorageService.saveAIPlan(_generatedPlan!);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Plan saved successfully!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final savedPlans = StorageService.getAIPlans();

    return Scaffold(
      appBar: AppBar(title: const Text('AI Trip Planner')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Plan Your Perfect Trip',
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Let AI help you create a personalized itinerary',
                      style: TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _destinationController,
                decoration: const InputDecoration(
                  labelText: 'Destination',
                  prefixIcon: Icon(Icons.location_on),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Enter destination' : null,
              ),
              const SizedBox(height: 16),
              const Text('Number of Days', style: TextStyle(fontWeight: FontWeight.bold)),
              Slider(
                value: _days.toDouble(),
                min: 1,
                max: 14,
                divisions: 13,
                label: '$_days days',
                onChanged: (v) => setState(() => _days = v.toInt()),
              ),
              const SizedBox(height: 16),
              const Text('Interests', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: ['Culture & Heritage', 'Adventure', 'Nature', 'Relaxation'].map((interest) {
                  return ChoiceChip(
                    label: Text(interest),
                    selected: _interests == interest,
                    onSelected: (selected) {
                      if (selected) setState(() => _interests = interest);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              SafarButton(
                text: 'Generate Plan',
                onPressed: _generatePlan,
                isLoading: _isGenerating,
                width: double.infinity,
              ),
              if (_generatedPlan != null) ...[
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Your Itinerary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    TextButton.icon(
                      onPressed: _savePlan,
                      icon: const Icon(Icons.save),
                      label: const Text('Save'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._buildItinerary(),
              ],
              if (savedPlans.isNotEmpty) ...[
                const Divider(height: 32),
                const Text('Saved Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ...savedPlans.map((plan) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Icon(Icons.map, color: AppTheme.primaryColor),
                      title: Text(plan['plan']?['destination'] ?? 'Trip Plan'),
                      subtitle: Text('${plan['plan']?['days'] ?? 0} days'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () async {
                          await StorageService.deleteAIPlan(plan['id']);
                          setState(() {});
                        },
                      ),
                    ),
                  );
                }).toList(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildItinerary() {
    final itinerary = _generatedPlan!['plan']!['itinerary'] as List;
    return itinerary.map<Widget>((day) {
      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Day ${day['day']}',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
              ),
              const SizedBox(height: 8),
              ...(day['activities'] as List).map((activity) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      Expanded(child: Text(activity.toString())),
                    ],
                  ),
                );
              }).toList(),
            ],
          ),
        ),
      );
    }).toList();
  }
}
