#!/usr/bin/env python3
"""
Streamlit Dashboard for Bolt Support Insights - Jira Issue Categorization Analysis
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime

# Set page configuration
st.set_page_config(
    page_title="Bolt Support Insights Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .sidebar-info {
        background-color: #e8f4fd;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data(file_path):
    """Load and preprocess the Jira data."""
    try:
        df = pd.read_csv(file_path)
        
        # Convert date columns
        date_columns = ['Created', 'Updated', 'Last Viewed', 'Resolved']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], format='%d/%m/%Y %H:%M', errors='coerce')
        
        # Clean category data
        df['Category'] = df['Category'].fillna('Uncategorized')
        df['Review_Flag'] = df['Review_Flag'].fillna('NO')
        
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return None

def create_category_bar_chart(df):
    """Create bar chart of issues by category."""
    category_counts = df['Category'].value_counts()
    
    # Create color map for categories
    colors = px.colors.qualitative.Set3
    color_map = {cat: colors[i % len(colors)] for i, cat in enumerate(category_counts.index)}
    
    fig = px.bar(
        x=category_counts.index,
        y=category_counts.values,
        title="📊 Number of Issues by Category",
        labels={'x': 'Category', 'y': 'Number of Issues'},
        color=category_counts.index,
        color_discrete_map=color_map
    )
    
    fig.update_layout(
        xaxis_tickangle=-45,
        height=500,
        showlegend=False,
        title_font_size=16
    )
    
    # Add value labels on bars
    fig.update_traces(texttemplate='%{y}', textposition='outside')
    
    return fig

def create_review_flag_chart(df):
    """Create pie chart for review flag distribution."""
    review_counts = df['Review_Flag'].value_counts()
    
    fig = px.pie(
        values=review_counts.values,
        names=review_counts.index,
        title="🚩 Review Flag Distribution",
        color_discrete_map={'YES': '#ff7f0e', 'NO': '#2ca02c'}
    )
    
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(height=400)
    
    return fig

def create_timeline_chart(df):
    """Create timeline chart of issue creation over time."""
    if 'Created' in df.columns:
        df_timeline = df.copy()
        df_timeline['Created_Month'] = df_timeline['Created'].dt.to_period('M').astype(str)
        timeline_data = df_timeline.groupby(['Created_Month', 'Category']).size().reset_index(name='Count')
        
        fig = px.bar(
            timeline_data,
            x='Created_Month',
            y='Count',
            color='Category',
            title="📅 Issue Creation Timeline by Category",
            labels={'Created_Month': 'Month', 'Count': 'Number of Issues'}
        )
        
        fig.update_layout(
            xaxis_tickangle=-45,
            height=400,
            legend=dict(orientation="h", yanchor="bottom", y=1.02)
        )
        
        return fig
    return None

def create_summary_metrics(df):
    """Create summary metrics."""
    total_issues = len(df)
    flagged_issues = len(df[df['Review_Flag'] == 'YES'])
    unique_categories = df['Category'].nunique()
    resolved_issues = len(df[df['Resolved'].notna()])
    
    return total_issues, flagged_issues, unique_categories, resolved_issues

def main():
    """Main dashboard function."""
    
    # Header
    st.markdown('<h1 class="main-header">📊 Bolt Support Insights Dashboard</h1>', unsafe_allow_html=True)
    st.markdown("---")
    
    # Load data
    data_file = '/Users/Spurthi.Serikari/Documents/Bolt Support Insights/Jira_ARLive_categorized.csv'
    df = load_data(data_file)
    
    if df is None:
        st.error("Failed to load data. Please check the file path and format.")
        return
    
    # Sidebar
    st.sidebar.markdown('<div class="sidebar-info"><h3>🔧 Dashboard Controls</h3></div>', unsafe_allow_html=True)
    
    # Category filter
    categories = ['All'] + sorted(df['Category'].unique().tolist())
    selected_category = st.sidebar.selectbox("📋 Filter by Category:", categories)
    
    # Review flag filter
    review_options = ['All', 'Flagged for Review', 'Auto-Assigned']
    selected_review = st.sidebar.selectbox("🚩 Filter by Review Status:", review_options)
    
    # Date range filter
    if 'Created' in df.columns and df['Created'].notna().any():
        min_date = df['Created'].min().date()
        max_date = df['Created'].max().date()
        date_range = st.sidebar.date_input(
            "📅 Date Range:",
            value=(min_date, max_date),
            min_value=min_date,
            max_value=max_date
        )
    
    # Apply filters
    filtered_df = df.copy()
    
    if selected_category != 'All':
        filtered_df = filtered_df[filtered_df['Category'] == selected_category]
    
    if selected_review == 'Flagged for Review':
        filtered_df = filtered_df[filtered_df['Review_Flag'] == 'YES']
    elif selected_review == 'Auto-Assigned':
        filtered_df = filtered_df[filtered_df['Review_Flag'] == 'NO']
    
    # Summary metrics
    total_issues, flagged_issues, unique_categories, resolved_issues = create_summary_metrics(filtered_df)
    
    # Display metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="📋 Total Issues",
            value=total_issues,
            delta=f"{len(filtered_df)} filtered" if len(filtered_df) != total_issues else None
        )
    
    with col2:
        st.metric(
            label="🚩 Flagged for Review",
            value=flagged_issues,
            delta=f"{(flagged_issues/total_issues*100):.1f}%" if total_issues > 0 else "0%"
        )
    
    with col3:
        st.metric(
            label="🏷️ Categories",
            value=unique_categories
        )
    
    with col4:
        st.metric(
            label="✅ Resolved",
            value=resolved_issues,
            delta=f"{(resolved_issues/total_issues*100):.1f}%" if total_issues > 0 else "0%"
        )
    
    st.markdown("---")
    
    # Main charts
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Category bar chart (main request)
        category_chart = create_category_bar_chart(filtered_df)
        st.plotly_chart(category_chart, use_container_width=True)
    
    with col2:
        # Review flag pie chart
        review_chart = create_review_flag_chart(filtered_df)
        st.plotly_chart(review_chart, use_container_width=True)
    
    # Timeline chart
    timeline_chart = create_timeline_chart(filtered_df)
    if timeline_chart:
        st.plotly_chart(timeline_chart, use_container_width=True)
    
    # Data tables
    st.markdown("---")
    st.markdown("### 📋 Issue Details")
    
    # Category breakdown table
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### Category Breakdown")
        category_stats = filtered_df.groupby('Category').agg({
            'Summary': 'count',
            'Review_Flag': lambda x: (x == 'YES').sum(),
            'Resolved': lambda x: x.notna().sum()
        }).rename(columns={
            'Summary': 'Total',
            'Review_Flag': 'Flagged',
            'Resolved': 'Resolved'
        })
        st.dataframe(category_stats, use_container_width=True)
    
    with col2:
        st.markdown("#### Recent Issues")
        if 'Created' in filtered_df.columns:
            recent_issues = filtered_df.nlargest(10, 'Created')[['Summary', 'Category', 'Created', 'Review_Flag']]
            st.dataframe(recent_issues, use_container_width=True)
    
    # Detailed data view
    if st.checkbox("🔍 Show Detailed Data"):
        st.markdown("#### All Issues")
        display_columns = ['Summary', 'Category', 'Created', 'Updated', 'Resolved', 'Review_Flag']
        available_columns = [col for col in display_columns if col in filtered_df.columns]
        st.dataframe(filtered_df[available_columns], use_container_width=True)
    
    # Download filtered data
    if st.button("📥 Download Filtered Data"):
        csv = filtered_df.to_csv(index=False)
        st.download_button(
            label="Download CSV",
            data=csv,
            file_name=f"bolt_support_insights_filtered_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )
    
    # Footer
    st.markdown("---")
    st.markdown(
        """
        <div style='text-align: center; color: #666; font-size: 0.9rem;'>
            📊 Bolt Support Insights Dashboard | Built with Streamlit & Plotly
        </div>
        """,
        unsafe_allow_html=True
    )

if __name__ == "__main__":
    main()






