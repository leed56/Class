import 'package:flutter/material.dart';

import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/metric_card.dart';
import '../../../../shared/widgets/premium_card.dart';
import '../../../../shared/widgets/quick_action_tile.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: const [
          _DashboardHeader(),
          SizedBox(height: 18),
          _HeroGreetingCard(),
          SizedBox(height: 18),
          _MetricGrid(),
          SizedBox(height: 18),
          _NextClassCard(),
          SizedBox(height: 18),
          _QuickActions(),
          SizedBox(height: 18),
          _FeeOverviewCard(),
          SizedBox(height: 18),
          _ScheduleCard(),
        ],
      ),
    );
  }
}

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Home',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.8,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Monday, 15 June 2026',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        IconButton.filledTonal(
          onPressed: () {},
          icon: const Icon(Icons.notifications_none_rounded),
        ),
        const SizedBox(width: 8),
        const CircleAvatar(
          radius: 20,
          backgroundColor: AppColors.primary,
          child: Text(
            'NP',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
        ),
      ],
    );
  }
}

class _HeroGreetingCard extends StatelessWidget {
  const _HeroGreetingCard();

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      padding: const EdgeInsets.all(22),
      gradient: const LinearGradient(
        colors: [AppColors.primaryDark, AppColors.primary],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.14),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Today at a glance',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Good morning,\nMr. Nimal Perera',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w900,
              height: 1.1,
              letterSpacing: -0.8,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'You have 4 classes today. 12 students still have pending fees for June.',
            style: TextStyle(color: Color(0xFFE7DEFF), fontSize: 14, height: 1.45),
          ),
        ],
      ),
    );
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - 12) / 2;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: const [
            SizedBox(
              width: 160,
              child: MetricCard(label: 'Classes Today', value: '4', icon: Icons.calendar_month_rounded, tone: AppColors.primary),
            ),
            SizedBox(
              width: 160,
              child: MetricCard(label: 'Attendance', value: '87%', icon: Icons.trending_up_rounded, tone: AppColors.success, delta: '+6% vs May'),
            ),
            SizedBox(
              width: 160,
              child: MetricCard(label: 'Pending Fees', value: '12', icon: Icons.group_remove_rounded, tone: AppColors.danger),
            ),
            SizedBox(
              width: 160,
              child: MetricCard(label: 'Collected', value: 'LKR 28,450', icon: Icons.account_balance_wallet_rounded, tone: AppColors.success, delta: '+18% this month'),
            ),
          ],
        );
      },
    );
  }
}

class _NextClassCard extends StatelessWidget {
  const _NextClassCard();

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Next class',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.calculate_rounded, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mathematics', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                    SizedBox(height: 4),
                    Text('Grade 9 • English Medium', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Row(
            children: [
              Icon(Icons.schedule_rounded, size: 18, color: AppColors.textSecondary),
              SizedBox(width: 8),
              Text('10:30 AM - 12:00 PM', style: TextStyle(fontWeight: FontWeight.w700)),
              Spacer(),
              Icon(Icons.location_on_outlined, size: 18, color: AppColors.textSecondary),
              SizedBox(width: 4),
              Text('Hall A', style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.fact_check_rounded),
            label: const Text('Take Attendance'),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.82,
          children: const [
            QuickActionTile(label: 'Add Student', icon: Icons.person_add_alt_rounded, color: AppColors.primary),
            QuickActionTile(label: 'Create Class', icon: Icons.add_box_rounded, color: AppColors.info),
            QuickActionTile(label: 'Payment', icon: Icons.payments_rounded, color: AppColors.success),
            QuickActionTile(label: 'Message', icon: Icons.chat_bubble_outline_rounded, color: AppColors.warning),
          ],
        ),
      ],
    );
  }
}

class _FeeOverviewCard extends StatelessWidget {
  const _FeeOverviewCard();

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('Fee collection', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(999)),
                child: const Text('June', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: const LinearProgressIndicator(
              value: 0.59,
              minHeight: 12,
              backgroundColor: AppColors.dangerSoft,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.success),
            ),
          ),
          const SizedBox(height: 14),
          const Row(
            children: [
              Expanded(child: _FeeValue(label: 'Collected', value: 'LKR 28,450', color: AppColors.success)),
              Expanded(child: _FeeValue(label: 'Outstanding', value: 'LKR 19,850', color: AppColors.danger)),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeeValue extends StatelessWidget {
  const _FeeValue({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 3),
              Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900)),
            ],
          ),
        ),
      ],
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard();

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text('Today\'s schedule', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
          SizedBox(height: 12),
          _ScheduleRow(time: '08:00 AM', title: 'Mathematics', meta: 'Grade 10 • English', status: 'Completed', color: AppColors.success),
          _ScheduleRow(time: '10:30 AM', title: 'Mathematics', meta: 'Grade 9 • English', status: 'Next', color: AppColors.primary),
          _ScheduleRow(time: '01:30 PM', title: 'Science', meta: 'Grade 8 • Sinhala', status: 'Upcoming', color: AppColors.warning),
        ],
      ),
    );
  }
}

class _ScheduleRow extends StatelessWidget {
  const _ScheduleRow({required this.time, required this.title, required this.meta, required this.status, required this.color});

  final String time;
  final String title;
  final String meta;
  final String status;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        children: [
          SizedBox(width: 74, child: Text(time, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700))),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
                const SizedBox(height: 3),
                Text(meta, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(999)),
            child: Text(status, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
